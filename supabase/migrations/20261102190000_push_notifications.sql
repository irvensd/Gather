-- Push tokens belong to a signed-in phone. A new Activity row is delivered through Expo's push service.

create extension if not exists pg_net;

create table if not exists public.push_tokens (
  token text primary key check (char_length(token) between 20 and 200),
  user_id uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public, anon, authenticated;

create or replace function public.register_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if p_token is null or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$' then
    perform public.raise_app('INVALID_INPUT');
  end if;
  insert into public.push_tokens (token, user_id)
  values (p_token, auth.uid())
  on conflict (token) do update set user_id = excluded.user_id, updated_at = now();
end;
$$;

create or replace function public.clear_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
end;
$$;

create or replace function public.dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  post_kind public.post_type;
  community_name text;
  noun text;
  message text;
  tokens jsonb;
begin
  select coalesce(jsonb_agg(token), '[]'::jsonb) into tokens
  from public.push_tokens
  where user_id = new.recipient_id;
  if tokens = '[]'::jsonb then return new; end if;

  select username into actor_name
  from public.profiles
  where id = new.actor_id and status <> 'deleted';

  select p.type, c.name into post_kind, community_name
  from public.posts p
  left join public.communities c on c.id = p.community_id
  where p.id = new.post_id;

  noun := case post_kind
    when 'question' then 'question'
    when 'prayer_request' then 'prayer request'
    when 'testimony' then 'testimony'
    else 'post'
  end;

  message := case new.type
    when 'comment_reply' then coalesce('@' || actor_name, 'Someone') || ' replied to your comment.'
    when 'mention' then coalesce('@' || actor_name, 'Someone') || ' mentioned you.'
    when 'prayer_milestone' then
      case
        when coalesce(new.count, 0) <= 1 then 'Someone prayed for your prayer request.'
        else new.count::text || ' people prayed for your prayer request.'
      end
    when 'vote_milestone' then 'Your ' || noun || ' reached ' || coalesce(new.count, 0)::text || ' thumbs up.'
    when 'content_removed' then
      case
        when new.comment_id is not null then 'A moderator removed your comment.'
        else 'A moderator removed your ' || noun || '.'
      end
    when 'new_report' then
      case
        when community_name is not null then 'New report in ' || community_name || '.'
        else 'New report to review.'
      end
    else coalesce('@' || actor_name, 'Someone') || ' replied to your ' || noun || '.'
  end;

  begin
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := jsonb_build_object(
        'to', tokens,
        'title', 'Gather',
        'body', message,
        'sound', 'default',
        'priority', 'high',
        'channelId', 'default',
        'data', jsonb_build_object('postId', new.post_id, 'commentId', new.comment_id, 'notificationId', new.id)
      ),
      params := '{}'::jsonb,
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      timeout_milliseconds := 5000
    );
  exception when others then
    return new;
  end;
  return new;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.dispatch_push();

revoke all on function public.register_push_token(text) from public;
revoke all on function public.clear_push_token(text) from public;
revoke all on function public.dispatch_push() from public;
grant execute on function public.register_push_token(text) to authenticated;
grant execute on function public.clear_push_token(text) to authenticated;
