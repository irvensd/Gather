-- "I prayed" is stored like a save: one row per person per prayer request.
-- The author is told at 1, 5, 10, 25, 50, and 100, once per level.

create table if not exists public.post_prayers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists post_prayers_post_idx on public.post_prayers (post_id);

alter table public.post_prayers enable row level security;
revoke all on public.post_prayers from public, anon, authenticated;

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
    'prayedCount', (select count(*) from public.post_prayers pr where pr.post_id = p.id),
    'userPrayed', p_viewer is not null and exists (select 1 from public.post_prayers pr where pr.post_id = p.id and pr.user_id = p_viewer),
    'createdAt', p.created_at,
    'updatedAt', p.updated_at
  );
end;
$$;

create or replace function public.get_feed(p_filter text, p_community_id uuid default null, p_offset integer default 0, p_limit integer default 15)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer := least(greatest(coalesce(p_limit, 15), 1), 50);
  off integer := greatest(coalesce(p_offset, 0), 0);
  viewer uuid := auth.uid();
  items jsonb;
  row_count integer;
begin
  if p_filter not in ('popular', 'new', 'following') then perform public.raise_app('INVALID_INPUT'); end if;
  if p_filter = 'following' and viewer is null then
    return jsonb_build_object('items', '[]'::jsonb, 'nextOffset', null);
  end if;
  with ranked as (
    select p.id,
      row_number() over (
        order by
          case when p_filter = 'popular' then
            (
              coalesce((select sum(value) from public.post_votes v where v.post_id = p.id), 0)
              + coalesce((select count(*) from public.comments c where c.post_id = p.id and c.status = 'published'), 0) * 2
              + coalesce((select count(*) from public.post_prayers pr where pr.post_id = p.id), 0)
              + 1
            )::float8
            / power(greatest(extract(epoch from (now() - p.created_at)) / 3600.0, 0) + 2, 1.5)
          else 0 end desc,
          p.created_at desc,
          p.id desc
      ) as ord
    from public.posts p
    where p.status = 'published'
      and public.can_see_post(p.id, viewer)
      and (p_community_id is null or p.community_id = p_community_id)
      and (
        p_filter <> 'following'
        or exists (select 1 from public.community_memberships m where m.user_id = viewer and m.community_id = p.community_id)
      )
  ),
  page as (select * from ranked where ord > off and ord <= off + lim)
  select coalesce(jsonb_agg(public.post_json(id, viewer) order by ord), '[]'::jsonb), count(*)
    into items, row_count
  from page;
  return jsonb_build_object('items', items, 'nextOffset', case when row_count = lim then off + lim else null end);
end;
$$;

create or replace function public.set_prayed(p_post_id uuid, p_prayed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if not exists (
    select 1 from public.posts
    where id = p_post_id and status = 'published' and type = 'prayer_request'
  ) then
    perform public.raise_app('NOT_FOUND');
  end if;
  delete from public.post_prayers where user_id = auth.uid() and post_id = p_post_id;
  if p_prayed then
    insert into public.post_prayers (user_id, post_id) values (auth.uid(), p_post_id);
  end if;
end;
$$;

create or replace function public.notify_prayer_milestone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  prayed integer;
  prefs record;
begin
  select author_id into post_author from public.posts where id = new.post_id and status = 'published';
  if post_author is null or post_author = new.user_id then return new; end if;
  select count(*) into prayed from public.post_prayers where post_id = new.post_id;
  if prayed not in (1, 5, 10, 25, 50, 100) then return new; end if;
  if exists (
    select 1 from public.notifications
    where post_id = new.post_id and type = 'prayer_milestone' and count >= prayed
  ) then return new; end if;
  select * into prefs from public.notification_preferences where user_id = post_author;
  if prefs.user_id is not null and not prefs.encouragement then return new; end if;
  insert into public.notifications (recipient_id, actor_id, type, post_id, count)
  values (post_author, null, 'prayer_milestone', new.post_id, prayed);
  return new;
end;
$$;

drop trigger if exists post_prayers_milestone on public.post_prayers;
create trigger post_prayers_milestone
  after insert on public.post_prayers
  for each row execute function public.notify_prayer_milestone();

revoke all on function public.set_prayed(uuid, boolean) from public;
revoke all on function public.notify_prayer_milestone() from public;
grant execute on function public.set_prayed(uuid, boolean) to authenticated;
