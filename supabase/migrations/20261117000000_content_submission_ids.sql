-- Scope submission IDs to their author and serialize concurrent retries before rate checks.
alter table public.posts add column submission_id uuid;
alter table public.comments add column submission_id uuid;

create unique index posts_author_submission_idx on public.posts (author_id, submission_id) where submission_id is not null;
create unique index comments_author_submission_idx on public.comments (author_id, submission_id) where submission_id is not null;

create or replace function public.create_post(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  submission uuid := nullif(p_input->>'submissionId', '')::uuid;
  refs jsonb := coalesce(p_input->'scriptureReferences', '[]'::jsonb);
  photo text := nullif(p_input->>'imagePath', '');
begin
  perform public.assert_active();
  if submission is not null then
    perform pg_advisory_xact_lock(hashtextextended('post:' || auth.uid()::text || ':' || submission::text, 0));
    select id into new_id from public.posts where author_id = auth.uid() and submission_id = submission;
    if found then return public.post_json(new_id, auth.uid()); end if;
  end if;
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
  insert into public.posts (community_id, author_id, type, title, body, scripture_references, image_path, submission_id)
  values (
    (p_input->>'communityId')::uuid,
    auth.uid(),
    (p_input->>'type')::public.post_type,
    trim(p_input->>'title'),
    trim(p_input->>'body'),
    refs,
    photo,
    submission
  )
  returning id into new_id;
  return public.post_json(new_id, auth.uid());
exception when invalid_text_representation or check_violation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.create_comment(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  submission uuid := nullif(p_input->>'submissionId', '')::uuid;
  post public.posts%rowtype;
  refs jsonb := coalesce(p_input->'scriptureReferences', '[]'::jsonb);
begin
  perform public.assert_active();
  if submission is not null then
    perform pg_advisory_xact_lock(hashtextextended('comment:' || auth.uid()::text || ':' || submission::text, 0));
    select id into new_id from public.comments where author_id = auth.uid() and submission_id = submission;
    if found then return public.comment_json(new_id, auth.uid()); end if;
  end if;
  if char_length(trim(p_input->>'body')) < 1 or char_length(trim(p_input->>'body')) > 5000 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  select * into post from public.posts where id = (p_input->>'postId')::uuid;
  if not found or post.status <> 'published' then perform public.raise_app('NOT_FOUND'); end if;
  if post.is_locked then perform public.raise_app('LOCKED'); end if;
  if public.is_blocked(auth.uid(), post.author_id) then perform public.raise_app('FORBIDDEN'); end if;
  perform public.enforce_rate('comment', 30);
  insert into public.comments (post_id, parent_comment_id, author_id, body, scripture_references, submission_id)
  values (post.id, nullif(p_input->>'parentCommentId', '')::uuid, auth.uid(), trim(p_input->>'body'), refs, submission)
  returning id into new_id;
  return public.comment_json(new_id, auth.uid());
exception when invalid_text_representation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;
