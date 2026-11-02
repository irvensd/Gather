-- A post photo lives in storage. The post row keeps only the path inside the author's folder.

alter table public.posts
  add column if not exists image_path text;

alter table public.posts
  drop constraint if exists posts_image_path_shape;

alter table public.posts
  add constraint posts_image_path_shape
  check (
    image_path is null
    or image_path ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.jpg$'
  );

create or replace function public.prepare_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.author_id is distinct from auth.uid() then perform public.raise_app('FORBIDDEN'); end if;
    if new.status <> 'published' or new.is_locked then perform public.raise_app('FORBIDDEN'); end if;
    if new.image_path is not null and split_part(new.image_path, '/', 1) is distinct from auth.uid()::text then
      perform public.raise_app('INVALID_INPUT');
    end if;
    return new;
  end if;
  if new.author_id is distinct from old.author_id then
    if new.author_id is not null then perform public.raise_app('FORBIDDEN'); end if;
    if auth.uid() is not null and old.author_id is distinct from auth.uid() and exists (select 1 from public.profiles where id = old.author_id) then
      perform public.raise_app('FORBIDDEN');
    end if;
  end if;
  if new.community_id is distinct from old.community_id or new.type is distinct from old.type then
    perform public.raise_app('FORBIDDEN');
  end if;
  if new.status is distinct from old.status then
    if not (
      (old.author_id = auth.uid() and old.status = 'published' and new.status = 'deleted')
      or (public.is_moderator(old.community_id, auth.uid()) and new.status = 'removed')
    ) then perform public.raise_app('FORBIDDEN'); end if;
  end if;
  if new.is_locked is distinct from old.is_locked and not public.is_moderator(old.community_id, auth.uid()) then
    perform public.raise_app('FORBIDDEN');
  end if;
  if new.image_path is distinct from old.image_path
     and not (old.author_id = auth.uid() and old.status = 'published' and not old.is_locked) then
    perform public.raise_app('FORBIDDEN');
  end if;
  if (new.title is distinct from old.title or new.body is distinct from old.body or new.scripture_references is distinct from old.scripture_references)
     and not (
       (old.author_id = auth.uid() and old.status = 'published' and not old.is_locked)
       or public.is_moderator(old.community_id, auth.uid())
     ) then
    perform public.raise_app('FORBIDDEN');
  end if;
  return new;
end;
$$;

create or replace function public.post_json(p_id uuid, p_viewer uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.posts%rowtype;
  author public.profiles%rowtype;
  community public.communities%rowtype;
  visible_body boolean;
begin
  select * into p from public.posts where id = p_id;
  if not found then return null; end if;
  select * into community from public.communities where id = p.community_id;
  select * into author from public.profiles where id = p.author_id;
  visible_body := p.status = 'published';
  return jsonb_build_object(
    'id', p.id,
    'communityId', community.id,
    'communitySlug', community.slug,
    'communityName', community.name,
    'communityIcon', community.icon,
    'authorId', case when author.id is not null and author.status <> 'deleted' then author.id else null end,
    'authorUsername', case when author.id is not null and author.status <> 'deleted' then author.username else null end,
    'authorDisplayName', case when author.id is not null and author.status <> 'deleted' then author.display_name else null end,
    'authorAvatarPath', case when author.id is not null and author.status <> 'deleted' then author.avatar_path else null end,
    'type', p.type,
    'title', p.title,
    'body', case when visible_body then p.body else '' end,
    'scriptureReferences', case when visible_body then p.scripture_references else '[]'::jsonb end,
    'imagePath', case when visible_body then p.image_path else null end,
    'status', p.status,
    'isLocked', p.is_locked,
    'score', coalesce((select sum(value) from public.post_votes v where v.post_id = p.id), 0),
    'commentCount', (select count(*) from public.comments c where c.post_id = p.id and c.status = 'published'),
    'userVote', coalesce((select value from public.post_votes v where v.post_id = p.id and v.user_id = p_viewer), 0),
    'saved', p_viewer is not null and exists (select 1 from public.saved_posts s where s.post_id = p.id and s.user_id = p_viewer),
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  );
end;
$$;

create or replace function public.create_post(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  refs jsonb := coalesce(p_input->'scriptureReferences', '[]'::jsonb);
  photo text := nullif(p_input->>'imagePath', '');
begin
  perform public.assert_active();
  if char_length(trim(p_input->>'title')) < 3 or char_length(trim(p_input->>'title')) > 200
     or char_length(trim(p_input->>'body')) < 1 or char_length(trim(p_input->>'body')) > 10000 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  if photo is not null and split_part(photo, '/', 1) is distinct from auth.uid()::text then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not exists (select 1 from public.communities where id = (p_input->>'communityId')::uuid and is_active) then
    perform public.raise_app('NOT_FOUND');
  end if;
  perform public.enforce_rate('post', 5);
  insert into public.posts (community_id, author_id, type, title, body, scripture_references, image_path)
  values (
    (p_input->>'communityId')::uuid,
    auth.uid(),
    (p_input->>'type')::public.post_type,
    trim(p_input->>'title'),
    trim(p_input->>'body'),
    refs,
    photo
  )
  returning id into new_id;
  return public.post_json(new_id, auth.uid());
exception when invalid_text_representation or check_violation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.update_post(p_post_id uuid, p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  refs jsonb := coalesce(p_input->'scriptureReferences', '[]'::jsonb);
  photo text := nullif(p_input->>'imagePath', '');
  post public.posts%rowtype;
begin
  perform public.assert_active();
  if char_length(trim(p_input->>'title')) < 3 or char_length(trim(p_input->>'body')) < 1 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  if photo is not null and split_part(photo, '/', 1) is distinct from auth.uid()::text then
    perform public.raise_app('INVALID_INPUT');
  end if;
  select * into post from public.posts where id = p_post_id;
  if not found then perform public.raise_app('NOT_FOUND'); end if;
  if post.author_id is distinct from auth.uid() or post.status <> 'published' or post.is_locked then
    perform public.raise_app('FORBIDDEN');
  end if;
  update public.posts
    set title = trim(p_input->>'title'),
        body = trim(p_input->>'body'),
        scripture_references = refs,
        image_path = photo
    where id = p_post_id;
  return public.post_json(p_post_id, auth.uid());
exception when invalid_text_representation or check_violation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then perform public.raise_app('AUTH_REQUIRED'); end if;
  delete from storage.objects where bucket_id = 'avatars' and (storage.foldername(name))[1] = uid::text;
  delete from storage.objects where bucket_id = 'post-photos' and (storage.foldername(name))[1] = uid::text;
  delete from auth.users where id = uid;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-photos', 'post-photos', true, 5242880, array['image/jpeg']::text[])
on conflict (id) do nothing;

create policy post_photos_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'post-photos');

create policy post_photos_owner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy post_photos_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy post_photos_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);
