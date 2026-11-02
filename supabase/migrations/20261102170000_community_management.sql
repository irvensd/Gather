-- Moderators can edit their community; the starter (or an admin) manages who moderates.
-- Also fixes moderate_content, whose variables shared names with columns and made every call fail as ambiguous.

create or replace function public.can_manage_moderators(p_community uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user is not null and (
    exists (select 1 from public.communities where id = p_community and created_by = p_user)
    or exists (select 1 from public.user_roles where user_id = p_user and role = 'admin')
  );
$$;

create or replace function public.update_community(
  p_community_id uuid,
  p_description text,
  p_rules text,
  p_icon text,
  p_color text,
  p_topic text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_description text := trim(coalesce(p_description, ''));
  clean_rules text := trim(coalesce(p_rules, ''));
begin
  perform public.assert_active();
  if not exists (select 1 from public.communities where id = p_community_id) then perform public.raise_app('NOT_FOUND'); end if;
  if not public.is_moderator(p_community_id, auth.uid()) then perform public.raise_app('FORBIDDEN'); end if;
  if char_length(clean_description) < 10 or char_length(clean_description) > 280 then perform public.raise_app('INVALID_INPUT'); end if;
  if char_length(clean_rules) > 1000 then perform public.raise_app('INVALID_INPUT'); end if;
  if p_icon is null or p_icon not in (
    'book-outline', 'library-outline', 'reader-outline', 'sunny-outline', 'moon-outline', 'people-outline',
    'happy-outline', 'heart-outline', 'hand-left-outline', 'chatbubbles-outline', 'mic-outline', 'musical-notes-outline',
    'home-outline', 'school-outline', 'medkit-outline', 'fitness-outline', 'nutrition-outline', 'cafe-outline',
    'leaf-outline', 'flower-outline', 'water-outline', 'globe-outline', 'compass-outline', 'calendar-outline',
    'camera-outline', 'pencil-outline', 'color-palette-outline', 'bicycle-outline', 'basketball-outline', 'bed-outline',
    'paw-outline', 'briefcase-outline', 'hammer-outline', 'bonfire-outline', 'gift-outline', 'eye-outline'
  ) then perform public.raise_app('INVALID_INPUT'); end if;
  if p_color is null or p_color not in ('green', 'teal', 'blue', 'purple', 'rose', 'clay', 'gold', 'slate') then perform public.raise_app('INVALID_INPUT'); end if;
  if p_topic is null or p_topic not in ('bible', 'church', 'family', 'support', 'everyday') then perform public.raise_app('INVALID_INPUT'); end if;
  if clean_rules = '' then
    clean_rules := 'Be respectful. Disagree with ideas, not people. Do not share someone else''s private information.';
  end if;
  update public.communities
    set description = clean_description, rules = clean_rules, icon = p_icon, color = p_color, topic = p_topic
    where id = p_community_id;
  return public.community_json(p_community_id, auth.uid());
end;
$$;

create or replace function public.moderator_json(p_community uuid, p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId', p.id,
    'username', p.username,
    'displayName', p.display_name,
    'avatarPath', p.avatar_path,
    'isStarter', exists (select 1 from public.communities c where c.id = p_community and c.created_by = p.id)
  )
  from public.profiles p
  where p.id = p_user and p.status <> 'deleted';
$$;

create or replace function public.list_community_moderators(p_community_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.moderator_json(m.community_id, m.user_id) order by (c.created_by = m.user_id) desc nulls last, p.username), '[]'::jsonb)
  from public.community_moderators m
  join public.communities c on c.id = m.community_id
  join public.profiles p on p.id = m.user_id and p.status <> 'deleted'
  where m.community_id = p_community_id;
$$;

create or replace function public.add_community_moderator(p_community_id uuid, p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  perform public.assert_active();
  if not public.can_manage_moderators(p_community_id, auth.uid()) then perform public.raise_app('STARTER_ONLY'); end if;
  select id into target from public.profiles where lower(username) = lower(trim(p_username)) and status = 'active';
  if target is null then perform public.raise_app('NO_SUCH_USER'); end if;
  if exists (select 1 from public.community_moderators where community_id = p_community_id and user_id = target) then
    perform public.raise_app('ALREADY_MODERATOR');
  end if;
  if not exists (select 1 from public.community_memberships where community_id = p_community_id and user_id = target) then
    perform public.raise_app('JOIN_FIRST');
  end if;
  insert into public.community_moderators (community_id, user_id) values (p_community_id, target);
  return public.moderator_json(p_community_id, target);
end;
$$;

create or replace function public.remove_community_moderator(p_community_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if exists (select 1 from public.communities where id = p_community_id and created_by = p_user_id) then
    perform public.raise_app('STARTER_STAYS');
  end if;
  if p_user_id <> auth.uid() and not public.can_manage_moderators(p_community_id, auth.uid()) then
    perform public.raise_app('STARTER_ONLY');
  end if;
  delete from public.community_moderators where community_id = p_community_id and user_id = p_user_id;
  if not found then perform public.raise_app('NOT_FOUND'); end if;
end;
$$;

create or replace function public.moderate_content(p_input jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community uuid := (p_input->>'communityId')::uuid;
  v_target_type public.report_target := (p_input->>'targetType')::public.report_target;
  v_target uuid := (p_input->>'targetId')::uuid;
  v_action text := p_input->>'action';
  v_reason text := trim(p_input->>'reason');
  v_report uuid := nullif(p_input->>'reportId', '')::uuid;
begin
  perform public.assert_active();
  if not public.is_moderator(v_community, auth.uid()) then perform public.raise_app('FORBIDDEN'); end if;
  if char_length(coalesce(v_reason, '')) < 3 or char_length(v_reason) > 500 then perform public.raise_app('INVALID_INPUT'); end if;
  if v_action = 'remove' and v_target_type = 'post' then
    update public.posts set status = 'removed', body = '', deleted_at = now()
      where id = v_target and community_id = v_community;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif v_action = 'remove' and v_target_type = 'comment' then
    update public.comments set status = 'removed', body = '', scripture_references = '[]'::jsonb, deleted_at = now()
      where id = v_target and post_id in (select id from public.posts where community_id = v_community);
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif v_action in ('lock', 'unlock') then
    update public.posts set is_locked = (v_action = 'lock')
      where id = v_target and community_id = v_community;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif v_action <> 'dismiss' then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if v_report is not null then
    update public.reports
      set status = case when v_action = 'dismiss' then 'dismissed'::public.report_status else 'actioned'::public.report_status end,
          resolved_at = now(),
          resolved_by = auth.uid()
      where id = v_report;
  end if;
  insert into public.moderation_actions (moderator_id, community_id, target_type, target_id, action, reason)
  values (auth.uid(), v_community, v_target_type, v_target, v_action, v_reason);
exception when invalid_text_representation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.list_reports()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'reporterId', r.reporter_id,
    'reporterUsername', pr.username,
    'targetType', r.target_type,
    'targetId', r.target_id,
    'postId', coalesce(po.id, cm.post_id),
    'communityId', c.id,
    'communityName', c.name,
    'communityIcon', c.icon,
    'communityColor', c.color,
    'reason', r.reason,
    'details', r.details,
    'status', r.status,
    'excerpt', coalesce(left(po.title, 140), left(cm.body, 140), ''),
    'createdAt', r.created_at
  ) order by r.created_at desc), '[]'::jsonb)
  from public.reports r
  left join public.profiles pr on pr.id = r.reporter_id
  left join public.posts po on r.target_type = 'post' and po.id = r.target_id
  left join public.comments cm on r.target_type = 'comment' and cm.id = r.target_id
  join public.communities c on c.id = public.report_community(r.target_type, r.target_id)
  where public.is_moderator(c.id, auth.uid());
$$;

create or replace function public.list_moderation_history()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'action', a.action,
    'reason', a.reason,
    'targetType', a.target_type,
    'targetId', a.target_id,
    'communityName', c.name,
    'communityIcon', c.icon,
    'communityColor', c.color,
    'moderatorUsername', case when m.status <> 'deleted' then m.username else null end,
    'createdAt', a.created_at
  ) order by a.created_at desc), '[]'::jsonb)
  from public.moderation_actions a
  join public.communities c on c.id = a.community_id
  left join public.profiles m on m.id = a.moderator_id
  where public.is_moderator(a.community_id, auth.uid());
$$;

grant execute on function
  public.list_community_moderators(uuid)
to anon, authenticated;

grant execute on function
  public.update_community(uuid, text, text, text, text, text),
  public.add_community_moderator(uuid, text),
  public.remove_community_moderator(uuid, uuid)
to authenticated;
