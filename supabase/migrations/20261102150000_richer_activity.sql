-- Activity rows say what they are about, and four new kinds of notification join replies and mentions.
-- prayer_milestone is reserved here; prayers are not stored on the server yet, so nothing creates it.

alter type public.notification_type add value if not exists 'prayer_milestone';
alter type public.notification_type add value if not exists 'vote_milestone';
alter type public.notification_type add value if not exists 'content_removed';
alter type public.notification_type add value if not exists 'new_report';

alter table public.notifications
  add column if not exists count integer,
  add column if not exists detail text check (detail is null or char_length(detail) <= 500);

create index if not exists notifications_milestone_idx on public.notifications (post_id, type, count) where count is not null;

alter table public.notification_preferences
  add column if not exists encouragement boolean not null default true;

create or replace function public.get_notification_preferences()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  prefs public.notification_preferences%rowtype;
begin
  perform public.assert_active();
  select * into prefs from public.notification_preferences where user_id = auth.uid();
  return jsonb_build_object(
    'replies', coalesce(prefs.replies, true),
    'mentions', coalesce(prefs.mentions, true),
    'encouragement', coalesce(prefs.encouragement, true)
  );
end;
$$;

create or replace function public.update_notification_preferences(p_prefs jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  insert into public.notification_preferences (user_id, replies, mentions, encouragement)
  values (
    auth.uid(),
    coalesce((p_prefs->>'replies')::boolean, true),
    coalesce((p_prefs->>'mentions')::boolean, true),
    coalesce((p_prefs->>'encouragement')::boolean, true)
  )
  on conflict (user_id) do update
    set replies = excluded.replies, mentions = excluded.mentions, encouragement = excluded.encouragement;
end;
$$;

create or replace function public.list_notifications()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id,
    'type', n.type,
    'actorId', case when a.status is distinct from 'deleted' then a.id else null end,
    'actorUsername', case when a.status is distinct from 'deleted' then a.username else null end,
    'actorDisplayName', case when a.status is distinct from 'deleted' then a.display_name else null end,
    'actorAvatarPath', case when a.status is distinct from 'deleted' then a.avatar_path else null end,
    'postId', n.post_id,
    'postType', p.type,
    'postTitle', p.title,
    'postAvailable', p.id is not null and p.status = 'published',
    'communityName', c.name,
    'communityIcon', c.icon,
    'communityColor', c.color,
    'commentId', n.comment_id,
    'snippet', case
      when n.type in ('post_reply', 'comment_reply', 'mention') then
        case when cm.status = 'published' then left(regexp_replace(cm.body, '\s+', ' ', 'g'), 140) else null end
      else n.detail
    end,
    'count', n.count,
    'isRead', n.is_read,
    'createdAt', n.created_at
  ) order by n.created_at desc), '[]'::jsonb)
  from public.notifications n
  left join public.profiles a on a.id = n.actor_id
  left join public.posts p on p.id = n.post_id
  left join public.communities c on c.id = p.community_id
  left join public.comments cm on cm.id = n.comment_id
  where n.recipient_id = auth.uid()
    and not public.is_blocked(auth.uid(), n.actor_id);
$$;

-- Thumbs-up milestones: 5, 10, 25, 50, 100. Each level is sent once per post.
create or replace function public.notify_vote_milestone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  thumbs integer;
  reached integer;
  prefs record;
begin
  if new.value <> 1 or (tg_op = 'UPDATE' and old.value = 1) then return new; end if;
  select author_id into post_author from public.posts where id = new.post_id and status = 'published';
  if post_author is null or post_author = new.user_id then return new; end if;
  select count(*) into thumbs from public.post_votes where post_id = new.post_id and value = 1;
  if thumbs not in (5, 10, 25, 50, 100) then return new; end if;
  reached := thumbs;
  if exists (
    select 1 from public.notifications
    where post_id = new.post_id and type = 'vote_milestone' and count >= reached
  ) then return new; end if;
  select * into prefs from public.notification_preferences where user_id = post_author;
  if prefs.user_id is not null and not prefs.encouragement then return new; end if;
  insert into public.notifications (recipient_id, actor_id, type, post_id, count)
  values (post_author, null, 'vote_milestone', new.post_id, reached);
  return new;
end;
$$;

drop trigger if exists post_votes_milestone on public.post_votes;
create trigger post_votes_milestone after insert or update of value on public.post_votes
  for each row execute function public.notify_vote_milestone();

-- Authors hear when a moderator removes their post or comment, with the reason the moderator gave.
create or replace function public.notify_content_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
  target_post uuid;
  target_comment uuid;
begin
  if new.action <> 'remove' then return new; end if;
  if new.target_type = 'post' then
    select author_id, id into author, target_post from public.posts where id = new.target_id;
  else
    select author_id, post_id, id into author, target_post, target_comment from public.comments where id = new.target_id;
  end if;
  if author is null or author = new.moderator_id or target_post is null then return new; end if;
  insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, detail)
  values (author, null, 'content_removed', target_post, target_comment, left(new.reason, 500));
  return new;
end;
$$;

drop trigger if exists moderation_actions_notify on public.moderation_actions;
create trigger moderation_actions_notify after insert on public.moderation_actions
  for each row execute function public.notify_content_removed();

-- Moderators of the community, and admins, hear about each new report. The reporter stays anonymous.
create or replace function public.notify_new_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid;
  target_comment uuid;
  target_community uuid;
  reason_label text;
begin
  if new.target_type = 'post' then
    select id, community_id into target_post, target_community from public.posts where id = new.target_id;
  else
    select c.post_id, c.id, p.community_id into target_post, target_comment, target_community
    from public.comments c join public.posts p on p.id = c.post_id
    where c.id = new.target_id;
  end if;
  if target_post is null then return new; end if;
  reason_label := case new.reason
    when 'harassment' then 'Harassment'
    when 'hate_or_threats' then 'Hate or threats'
    when 'spam_or_scam' then 'Spam or scam'
    when 'personal_information' then 'Personal information'
    else 'Other'
  end;
  insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id, detail)
  select reviewer, null, 'new_report', target_post, target_comment, reason_label
  from (
    select user_id as reviewer from public.community_moderators where community_id = target_community
    union
    select user_id from public.user_roles where role = 'admin'
  ) reviewers
  where reviewer is distinct from new.reporter_id;
  return new;
end;
$$;

drop trigger if exists reports_notify on public.reports;
create trigger reports_notify after insert on public.reports
  for each row execute function public.notify_new_report();
