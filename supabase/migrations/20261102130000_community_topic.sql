-- A community names its own topic when it is created, so Explore can group it.

alter table public.communities
  add column if not exists topic text
  check (topic is null or topic in ('bible', 'church', 'family', 'support', 'everyday'));

create or replace function public.community_json(p_id uuid, p_viewer uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'name', c.name,
    'description', c.description,
    'icon', c.icon,
    'rules', c.rules,
    'memberCount', (select count(*) from public.community_memberships m where m.community_id = c.id),
    'joined', p_viewer is not null and exists (select 1 from public.community_memberships m where m.community_id = c.id and m.user_id = p_viewer),
    'isActive', c.is_active,
    'topic', c.topic,
    'createdByUsername', creator.username,
    'createdByDisplayName', coalesce(creator.display_name, creator.username)
  )
  from public.communities c
  left join public.profiles creator on creator.id = c.created_by and creator.status <> 'deleted'
  where c.id = p_id;
$$;

drop function if exists public.create_community(text, text, text, text);

create or replace function public.create_community(
  p_name text,
  p_description text,
  p_rules text,
  p_icon text,
  p_topic text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g');
  clean_description text := trim(coalesce(p_description, ''));
  clean_rules text := trim(coalesce(p_rules, ''));
  next_slug text;
  new_id uuid;
begin
  perform public.assert_active();
  if clean_name !~ '^[A-Za-z][A-Za-z0-9 ]{2,31}$' then
    perform public.raise_app('INVALID_INPUT');
  end if;
  next_slug := lower(regexp_replace(clean_name, '\s+', '-', 'g'));
  if next_slug in ('new', 'explore', 'settings', 'search', 'gather', 'admin', 'moderator', 'support', 'help') then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if char_length(clean_description) < 10 or char_length(clean_description) > 280 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if char_length(clean_rules) > 1000 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if p_icon not in (
    'book-outline', 'sunny-outline', 'people-outline', 'library-outline', 'chatbubbles-outline',
    'eye-outline', 'compass-outline', 'heart-outline', 'leaf-outline', 'cafe-outline'
  ) then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if p_topic is null or p_topic not in ('bible', 'church', 'family', 'support', 'everyday') then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if exists (
    select 1 from public.communities as existing
    where existing.slug = next_slug or lower(existing.name) = lower(clean_name)
  ) then
    perform public.raise_app('COMMUNITY_TAKEN');
  end if;
  perform public.enforce_rate('community', 3);
  if clean_rules = '' then
    clean_rules := 'Be respectful. Disagree with ideas, not people. Do not share someone else''s private information.';
  end if;
  insert into public.communities (slug, name, description, icon, rules, created_by, topic)
  values (next_slug, clean_name, clean_description, p_icon, clean_rules, auth.uid(), p_topic)
  returning id into new_id;
  insert into public.community_memberships (user_id, community_id) values (auth.uid(), new_id);
  insert into public.community_moderators (community_id, user_id) values (new_id, auth.uid());
  return public.community_json(new_id, auth.uid());
end;
$$;

grant execute on function public.create_community(text, text, text, text, text) to authenticated;
