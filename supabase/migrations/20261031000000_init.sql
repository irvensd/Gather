-- Gather initial schema.
-- The mobile app uses the publishable key only. These functions are the trusted write path.
-- Do not put the service-role key in the app or in EXPO_PUBLIC variables.

create extension if not exists pgcrypto;

create type public.post_type as enum ('question', 'discussion', 'testimony', 'prayer_request');
create type public.content_status as enum ('published', 'removed', 'deleted');
create type public.profile_status as enum ('active', 'suspended', 'deleted');
create type public.onboarding_step as enum ('username', 'interests', 'done');
create type public.notification_type as enum ('post_reply', 'comment_reply', 'mention');
create type public.report_reason as enum ('harassment', 'hate_or_threats', 'spam_or_scam', 'personal_information', 'other');
create type public.report_status as enum ('open', 'dismissed', 'actioned');
create type public.report_target as enum ('post', 'comment');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  bio text,
  avatar_path text,
  status public.profile_status not null default 'active',
  onboarding_step public.onboarding_step not null default 'username',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 20),
  constraint profiles_username_shape check (username ~ '^[A-Za-z][A-Za-z0-9_]{2,19}$' or username ~ '^deleted_[0-9a-f]{8}$' or username ~ '^user_[0-9a-f]{12}$'),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) <= 40),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 280)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

create table public.user_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin'))
);

create table public.scripture_books (
  name text primary key,
  verses integer[] not null
);

insert into public.scripture_books (name, verses) values
  ('Genesis', array[31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26]),
  ('Exodus', array[22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]),
  ('Leviticus', array[17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34]),
  ('Numbers', array[54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13]),
  ('Deuteronomy', array[46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12]),
  ('Joshua', array[18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33]),
  ('Judges', array[36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25]),
  ('Ruth', array[22,23,18,22]),
  ('1 Samuel', array[28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13]),
  ('2 Samuel', array[27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25]),
  ('1 Kings', array[53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53]),
  ('2 Kings', array[18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30]),
  ('1 Chronicles', array[54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30]),
  ('2 Chronicles', array[17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23]),
  ('Ezra', array[11,70,13,24,17,22,28,36,15,44]),
  ('Nehemiah', array[11,20,32,23,19,19,73,18,38,39,36,47,31]),
  ('Esther', array[22,23,15,17,14,14,10,17,32,3]),
  ('Job', array[22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17]),
  ('Psalms', array[6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6]),
  ('Proverbs', array[33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31]),
  ('Ecclesiastes', array[18,26,22,16,20,12,29,17,18,20,10,14]),
  ('Song of Solomon', array[17,17,11,16,16,13,13,14]),
  ('Isaiah', array[31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24]),
  ('Jeremiah', array[19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34]),
  ('Lamentations', array[22,22,66,22,22]),
  ('Ezekiel', array[28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35]),
  ('Daniel', array[21,49,30,37,31,28,28,27,27,21,45,13]),
  ('Hosea', array[11,23,5,19,15,11,16,14,17,15,12,14,16,9]),
  ('Joel', array[20,32,21]),
  ('Amos', array[15,16,15,13,27,14,17,14,15]),
  ('Obadiah', array[21]),
  ('Jonah', array[17,10,10,11]),
  ('Micah', array[16,13,12,13,15,16,20]),
  ('Nahum', array[15,13,19]),
  ('Habakkuk', array[17,20,19]),
  ('Zephaniah', array[18,15,20]),
  ('Haggai', array[15,23]),
  ('Zechariah', array[21,13,10,14,11,15,14,23,17,12,17,14,9,21]),
  ('Malachi', array[14,17,18,6]),
  ('Matthew', array[25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20]),
  ('Mark', array[45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20]),
  ('Luke', array[80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]),
  ('John', array[51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25]),
  ('Acts', array[26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31]),
  ('Romans', array[32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27]),
  ('1 Corinthians', array[31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24]),
  ('2 Corinthians', array[24,17,18,18,21,18,16,24,15,18,33,21,14]),
  ('Galatians', array[24,21,29,31,26,18]),
  ('Ephesians', array[23,22,21,32,33,24]),
  ('Philippians', array[30,30,21,23]),
  ('Colossians', array[29,23,25,18]),
  ('1 Thessalonians', array[10,20,13,18,28]),
  ('2 Thessalonians', array[12,17,18]),
  ('1 Timothy', array[20,15,16,16,25,21]),
  ('2 Timothy', array[18,26,17,22]),
  ('Titus', array[16,15,15]),
  ('Philemon', array[25]),
  ('Hebrews', array[14,18,19,16,14,20,28,13,28,39,40,29,25]),
  ('James', array[27,26,18,17,20]),
  ('1 Peter', array[25,25,22,19,14]),
  ('2 Peter', array[21,22,18]),
  ('1 John', array[10,29,24,21,21]),
  ('2 John', array[13]),
  ('3 John', array[14]),
  ('Jude', array[25]),
  ('Revelation', array[20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null,
  icon text not null,
  rules text not null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table public.community_memberships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);

create table public.community_moderators (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id),
  author_id uuid references public.profiles (id) on delete set null,
  type public.post_type not null,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 0 and 10000),
  scripture_references jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'published',
  is_locked boolean not null default false,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index posts_community_created_idx on public.posts (community_id, created_at desc) where status = 'published';
create index posts_created_idx on public.posts (created_at desc) where status = 'published';
create index posts_author_idx on public.posts (author_id);
create index posts_search_idx on public.posts using gin (search_vector);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 0 and 5000),
  scripture_references jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'published',
  depth integer not null default 0 check (depth between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comments_post_created_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_comment_id);
create index comments_author_idx on public.comments (author_id);

create table public.post_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index post_votes_post_idx on public.post_votes (post_id);

create table public.comment_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create index comment_votes_comment_idx on public.comment_votes (comment_id);

create table public.saved_posts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  replies boolean not null default true,
  mentions boolean not null default true
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type public.notification_type not null,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where is_read = false;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index reports_status_idx on public.reports (status, created_at desc);

create table public.blocked_users (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles (id) on delete set null,
  community_id uuid not null references public.communities (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  action text not null check (action in ('remove', 'lock', 'unlock', 'dismiss')),
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now()
);

create index moderation_actions_community_idx on public.moderation_actions (community_id, created_at desc);

create table public.rate_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_events_lookup_idx on public.rate_events (user_id, action, created_at desc);

insert into public.communities (id, slug, name, description, icon, rules) values
  ('a1000000-0000-4000-8000-000000000001', 'bible-questions', 'BibleQuestions', 'Hard questions, Scripture interpretations, and biblical discussions.', 'book-outline', E'Ask the question you actually have.\nCite the passage you are discussing when you can.\nDisagree with an interpretation, not with a person’s worth.\nDo not present your reading as the only one a faithful person could hold.'),
  ('a1000000-0000-4000-8000-000000000002', 'adventist-life', 'AdventistLife', 'Church life, funny experiences, Adventist culture, and everyday conversations.', 'sunny-outline', E'Humor is welcome. Humiliation is not.\nStories about real congregations should not identify private people.\nCultural conversation can be light without becoming careless.'),
  ('a1000000-0000-4000-8000-000000000003', 'relationships', 'Relationships', 'Christian dating, marriage, friendships, boundaries, and relationships.', 'people-outline', E'Do not share someone else’s private story.\nAdvice should leave room for another person’s conscience.\nNo matchmaking, no solicitation, and no pressure.'),
  ('a1000000-0000-4000-8000-000000000004', 'sabbath-school', 'SabbathSchool', 'Weekly Bible lesson conversations and reflections.', 'library-outline', E'Stay close to the week’s passage and the questions it raises.\nClassrooms differ. Describe your experience without scoring other classes.\nQuestions are as welcome as conclusions.'),
  ('a1000000-0000-4000-8000-000000000005', 'church-and-culture', 'ChurchAndCulture', 'Church leadership, practical issues, difficult conversations, and generational perspectives.', 'chatbubbles-outline', E'Criticism of practices and decisions is allowed.\nPersonal attacks, rumors, and unnamed accusations are not.\nDo not post private information about leaders or members.'),
  ('a1000000-0000-4000-8000-000000000006', 'prophecy', 'Prophecy', 'Daniel, Revelation, the sanctuary, and Christian eschatology.', 'eye-outline', E'Separate the text, the interpretation, and the speculation.\nDo not use prophecy to threaten or rank other people.\nBe honest about uncertainty.'),
  ('a1000000-0000-4000-8000-000000000007', 'young-adults', 'YoungAdults', 'Friendships, faith, careers, transitions, and young adult life.', 'compass-outline', E'This is a conversation among adults.\nCareer and life questions do not need a tidy spiritual ending.\nBe specific enough to be useful and careful with other people’s details.'),
  ('a1000000-0000-4000-8000-000000000008', 'prayer-requests', 'PrayerRequests', 'Prayer, encouragement, and spiritual support.', 'heart-outline', E'Share only what you want in public.\nRespond with care. Do not interrogate someone who asked for prayer.\nDo not post another person’s crisis for them.');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger posts_updated before update on public.posts for each row execute function public.touch_updated_at();
create trigger comments_updated before update on public.comments for each row execute function public.touch_updated_at();

create or replace function public.raise_app(p_token text)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_token using errcode = 'P0001';
end;
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocked_users
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.is_moderator(p_community uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user is not null and (
    exists (select 1 from public.community_moderators where community_id = p_community and user_id = p_user)
    or exists (select 1 from public.user_roles where user_id = p_user and role = 'admin')
  );
$$;

create or replace function public.scripture_ok(p_refs jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  item jsonb;
  book_name text;
  chapter integer;
  verse_start integer;
  verse_end integer;
  counts integer[];
begin
  if p_refs is null or p_refs = '[]'::jsonb then return true; end if;
  if jsonb_typeof(p_refs) <> 'array' or jsonb_array_length(p_refs) > 20 then return false; end if;
  for item in select value from jsonb_array_elements(p_refs) loop
    book_name := item->>'book';
    chapter := (item->>'chapter')::integer;
    verse_start := (item->>'verseStart')::integer;
    verse_end := coalesce((item->>'verseEnd')::integer, verse_start);
    select verses into counts from public.scripture_books where name = book_name;
    if counts is null or chapter < 1 or chapter > cardinality(counts) then return false; end if;
    if verse_start < 1 or verse_end < verse_start or verse_end > counts[chapter] then return false; end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.enforce_rate(p_action text, p_max integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.rate_events (user_id, action) values (auth.uid(), p_action);
  if (select count(*) from public.rate_events where user_id = auth.uid() and action = p_action and created_at > now() - interval '1 hour') > p_max then
    perform public.raise_app('RATE_LIMIT');
  end if;
end;
$$;

create or replace function public.assert_active()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then perform public.raise_app('AUTH_REQUIRED'); end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'active') then
    perform public.raise_app('SUSPENDED');
  end if;
end;
$$;

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

create trigger posts_guard before insert or update on public.posts for each row execute function public.prepare_post();

create or replace function public.prepare_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_post uuid;
  parent_depth integer;
begin
  if tg_op = 'INSERT' then
    if new.author_id is distinct from auth.uid() then perform public.raise_app('FORBIDDEN'); end if;
    if new.parent_comment_id is null then
      new.depth := 0;
    else
      select post_id, depth into parent_post, parent_depth from public.comments where id = new.parent_comment_id;
      if parent_post is null or parent_post <> new.post_id then perform public.raise_app('INVALID_INPUT'); end if;
      new.depth := parent_depth + 1;
      if new.depth > 6 then perform public.raise_app('MAX_DEPTH'); end if;
    end if;
    return new;
  end if;
  if new.author_id is distinct from old.author_id then
    if new.author_id is not null then perform public.raise_app('FORBIDDEN'); end if;
    if auth.uid() is not null and old.author_id is distinct from auth.uid() and exists (select 1 from public.profiles where id = old.author_id) then
      perform public.raise_app('FORBIDDEN');
    end if;
  end if;
  if new.post_id is distinct from old.post_id or new.parent_comment_id is distinct from old.parent_comment_id then
    perform public.raise_app('FORBIDDEN');
  end if;
  if new.status is distinct from old.status then
    if not (
      (old.author_id = auth.uid() and old.status = 'published' and new.status = 'deleted')
      or (public.is_moderator((select community_id from public.posts where id = old.post_id), auth.uid()) and new.status = 'removed')
    ) then perform public.raise_app('FORBIDDEN'); end if;
  end if;
  return new;
end;
$$;

create trigger comments_guard before insert or update on public.comments for each row execute function public.prepare_comment();

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  post_kind public.post_type;
  parent_author uuid;
  prefs record;
  mentioned text;
  mentioned_id uuid;
  recipient uuid;
begin
  if new.status <> 'published' then return new; end if;
  select author_id, type into post_author, post_kind from public.posts where id = new.post_id;
  if new.parent_comment_id is not null then
    select author_id into parent_author from public.comments where id = new.parent_comment_id;
    recipient := parent_author;
  else
    recipient := post_author;
  end if;
  if recipient is not null and recipient <> new.author_id and not public.is_blocked(new.author_id, recipient) then
    select * into prefs from public.notification_preferences where user_id = recipient;
    if prefs.user_id is null or prefs.replies then
      insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
      values (recipient, new.author_id, case when new.parent_comment_id is null then 'post_reply'::public.notification_type else 'comment_reply'::public.notification_type end, new.post_id, new.id);
    end if;
  end if;
  for mentioned in select distinct (regexp_matches(new.body, '@([A-Za-z][A-Za-z0-9_]{2,19})', 'g'))[1] loop
    select id into mentioned_id from public.profiles where lower(username) = lower(mentioned) and status = 'active';
    if mentioned_id is null or mentioned_id = new.author_id or public.is_blocked(new.author_id, mentioned_id) then continue; end if;
    select * into prefs from public.notification_preferences where user_id = mentioned_id;
    if prefs.user_id is not null and not prefs.mentions then continue; end if;
    insert into public.notifications (recipient_id, actor_id, type, post_id, comment_id)
    values (mentioned_id, new.author_id, 'mention', new.post_id, new.id);
  end loop;
  return new;
end;
$$;

create trigger comments_notify after insert on public.comments for each row execute function public.notify_on_comment();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated text;
begin
  generated := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  insert into public.profiles (id, username) values (new.id, generated);
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.profile_json(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'username', p.username,
    'displayName', p.display_name,
    'bio', p.bio,
    'avatarPath', p.avatar_path,
    'status', p.status,
    'onboardingStep', p.onboarding_step,
    'createdAt', p.created_at,
    'postCount', (select count(*) from public.posts where author_id = p.id and status = 'published'),
    'commentCount', (select count(*) from public.comments where author_id = p.id and status = 'published')
  )
  from public.profiles p
  where p.id = p_id and p.status <> 'deleted';
$$;

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
    'isActive', c.is_active
  )
  from public.communities c
  where c.id = p_id;
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

create or replace function public.comment_json(p_id uuid, p_viewer uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.comments%rowtype;
  author public.profiles%rowtype;
  concealed boolean;
  published boolean;
begin
  select * into c from public.comments where id = p_id;
  if not found then return null; end if;
  select * into author from public.profiles where id = c.author_id;
  concealed := public.is_blocked(p_viewer, c.author_id);
  published := c.status = 'published' and not concealed;
  return jsonb_build_object(
    'id', c.id,
    'postId', c.post_id,
    'parentCommentId', c.parent_comment_id,
    'authorId', case when published and author.status is distinct from 'deleted' then author.id else null end,
    'authorUsername', case when published and author.status is distinct from 'deleted' then author.username else null end,
    'authorDisplayName', case when published and author.status is distinct from 'deleted' then author.display_name else null end,
    'authorAvatarPath', case when published and author.status is distinct from 'deleted' then author.avatar_path else null end,
    'body', case when published then c.body else '' end,
    'scriptureReferences', case when published then c.scripture_references else '[]'::jsonb end,
    'status', case when concealed then 'removed' else c.status end,
    'concealed', concealed,
    'depth', c.depth,
    'score', coalesce((select sum(value) from public.comment_votes v where v.comment_id = c.id), 0),
    'userVote', coalesce((select value from public.comment_votes v where v.comment_id = c.id and v.user_id = p_viewer), 0),
    'createdAt', c.created_at
  );
end;
$$;

create or replace function public.can_see_post(p_id uuid, p_viewer uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.posts%rowtype;
begin
  select * into p from public.posts where id = p_id;
  if not found then return false; end if;
  if public.is_blocked(p_viewer, p.author_id) then return false; end if;
  if p.status = 'published' then return true; end if;
  if p_viewer is not null and (p.author_id = p_viewer or public.is_moderator(p.community_id, p_viewer)) then return true; end if;
  return false;
end;
$$;

create or replace function public.get_current_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then null else public.profile_json(auth.uid()) end;
$$;

create or replace function public.get_profile(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  select id into found_id from public.profiles where lower(username) = lower(p_username) and status <> 'deleted';
  if found_id is null or public.is_blocked(auth.uid(), found_id) then perform public.raise_app('NOT_FOUND'); end if;
  return public.profile_json(found_id);
end;
$$;

create or replace function public.update_own_profile(p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  next_username text;
begin
  perform public.assert_active();
  if p_patch ? 'username' then
    next_username := trim(p_patch->>'username');
    if next_username !~ '^[A-Za-z][A-Za-z0-9_]{2,19}$' or lower(next_username) in ('admin','administrator','moderator','gather','support','deleted','system','anonymous','null') then
      perform public.raise_app('USERNAME_INVALID');
    end if;
    if exists (select 1 from public.profiles where lower(username) = lower(next_username) and id <> auth.uid()) then
      perform public.raise_app('USERNAME_TAKEN');
    end if;
    update public.profiles set username = next_username where id = auth.uid();
  end if;
  if p_patch ? 'displayName' then
    if char_length(trim(p_patch->>'displayName')) > 40 then perform public.raise_app('INVALID_INPUT'); end if;
    update public.profiles set display_name = nullif(trim(p_patch->>'displayName'), '') where id = auth.uid();
  end if;
  if p_patch ? 'bio' then
    if char_length(trim(p_patch->>'bio')) > 280 then perform public.raise_app('INVALID_INPUT'); end if;
    update public.profiles set bio = nullif(trim(p_patch->>'bio'), '') where id = auth.uid();
  end if;
  if p_patch ? 'avatarPath' then
    if p_patch->>'avatarPath' is not null and p_patch->>'avatarPath' <> auth.uid()::text || '/avatar.jpg' then
      perform public.raise_app('INVALID_INPUT');
    end if;
    update public.profiles set avatar_path = p_patch->>'avatarPath' where id = auth.uid();
  end if;
  if p_patch ? 'onboardingStep' then
    update public.profiles set onboarding_step = (p_patch->>'onboardingStep')::public.onboarding_step where id = auth.uid();
  end if;
  return public.profile_json(auth.uid());
exception when invalid_text_representation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.list_communities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.community_json(c.id, auth.uid()) order by c.name), '[]'::jsonb)
  from public.communities c
  where c.is_active;
$$;

create or replace function public.get_community(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  select id into found_id from public.communities where slug = p_slug and is_active;
  if found_id is null then perform public.raise_app('NOT_FOUND'); end if;
  return public.community_json(found_id, auth.uid());
end;
$$;

create or replace function public.set_membership(p_community_id uuid, p_join boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if not exists (select 1 from public.communities where id = p_community_id and is_active) then
    perform public.raise_app('NOT_FOUND');
  end if;
  delete from public.community_memberships where user_id = auth.uid() and community_id = p_community_id;
  if p_join then
    insert into public.community_memberships (user_id, community_id) values (auth.uid(), p_community_id);
  end if;
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
            (coalesce((select sum(value) from public.post_votes v where v.post_id = p.id), 0) + 1)::float8
            / power(extract(epoch from (now() - p.created_at)) / 3600.0 + 2, 1.5)
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

create or replace function public.get_post(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.can_see_post(p_post_id, auth.uid()) then perform public.raise_app('NOT_FOUND'); end if;
  result := public.post_json(p_post_id, auth.uid());
  if result is null then perform public.raise_app('NOT_FOUND'); end if;
  return result;
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
begin
  perform public.assert_active();
  if char_length(trim(p_input->>'title')) < 3 or char_length(trim(p_input->>'title')) > 200
     or char_length(trim(p_input->>'body')) < 1 or char_length(trim(p_input->>'body')) > 10000 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  if not exists (select 1 from public.communities where id = (p_input->>'communityId')::uuid and is_active) then
    perform public.raise_app('NOT_FOUND');
  end if;
  perform public.enforce_rate('post', 5);
  insert into public.posts (community_id, author_id, type, title, body, scripture_references)
  values (
    (p_input->>'communityId')::uuid,
    auth.uid(),
    (p_input->>'type')::public.post_type,
    trim(p_input->>'title'),
    trim(p_input->>'body'),
    refs
  )
  returning id into new_id;
  return public.post_json(new_id, auth.uid());
exception when invalid_text_representation then
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
begin
  perform public.assert_active();
  if char_length(trim(p_input->>'title')) < 3 or char_length(trim(p_input->>'body')) < 1 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  update public.posts
    set title = trim(p_input->>'title'), body = trim(p_input->>'body'), scripture_references = refs
    where id = p_post_id;
  if not found then perform public.raise_app('NOT_FOUND'); end if;
  return public.post_json(p_post_id, auth.uid());
end;
$$;

create or replace function public.delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  update public.posts set status = 'deleted', deleted_at = now() where id = p_post_id and author_id = auth.uid() and status = 'published';
  if not found then perform public.raise_app('FORBIDDEN'); end if;
end;
$$;

create or replace function public.get_comments(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_see_post(p_post_id, auth.uid()) then perform public.raise_app('NOT_FOUND'); end if;
  return coalesce((
    select jsonb_agg(public.comment_json(c.id, auth.uid()) order by c.created_at)
    from (
      select id, created_at from public.comments where post_id = p_post_id order by created_at desc limit 400
    ) c
  ), '[]'::jsonb);
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
  post public.posts%rowtype;
  refs jsonb := coalesce(p_input->'scriptureReferences', '[]'::jsonb);
begin
  perform public.assert_active();
  if char_length(trim(p_input->>'body')) < 1 or char_length(trim(p_input->>'body')) > 5000 then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if not public.scripture_ok(refs) then perform public.raise_app('INVALID_INPUT'); end if;
  select * into post from public.posts where id = (p_input->>'postId')::uuid;
  if not found or post.status <> 'published' then perform public.raise_app('NOT_FOUND'); end if;
  if post.is_locked then perform public.raise_app('LOCKED'); end if;
  if public.is_blocked(auth.uid(), post.author_id) then perform public.raise_app('FORBIDDEN'); end if;
  perform public.enforce_rate('comment', 30);
  insert into public.comments (post_id, parent_comment_id, author_id, body, scripture_references)
  values (post.id, nullif(p_input->>'parentCommentId', '')::uuid, auth.uid(), trim(p_input->>'body'), refs)
  returning id into new_id;
  return public.comment_json(new_id, auth.uid());
exception when invalid_text_representation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  update public.comments
    set status = 'deleted', body = '', scripture_references = '[]'::jsonb, deleted_at = now()
    where id = p_comment_id and author_id = auth.uid() and status = 'published';
  if not found then perform public.raise_app('FORBIDDEN'); end if;
end;
$$;

create or replace function public.cast_post_vote(p_post_id uuid, p_value smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  post public.posts%rowtype;
  score integer;
begin
  perform public.assert_active();
  if p_value not in (-1, 0, 1) then perform public.raise_app('INVALID_INPUT'); end if;
  select * into post from public.posts where id = p_post_id;
  if not found or post.status <> 'published' then perform public.raise_app('NOT_FOUND'); end if;
  if post.is_locked then perform public.raise_app('LOCKED'); end if;
  delete from public.post_votes where user_id = auth.uid() and post_id = p_post_id;
  if p_value <> 0 then
    insert into public.post_votes (user_id, post_id, value) values (auth.uid(), p_post_id, p_value);
  end if;
  select coalesce(sum(value), 0) into score from public.post_votes where post_id = p_post_id;
  return jsonb_build_object('score', score, 'userVote', p_value);
end;
$$;

create or replace function public.cast_comment_vote(p_comment_id uuid, p_value smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  comment public.comments%rowtype;
  post public.posts%rowtype;
  score integer;
begin
  perform public.assert_active();
  if p_value not in (-1, 0, 1) then perform public.raise_app('INVALID_INPUT'); end if;
  select * into comment from public.comments where id = p_comment_id;
  if not found then perform public.raise_app('NOT_FOUND'); end if;
  select * into post from public.posts where id = comment.post_id;
  if comment.status <> 'published' or post.status <> 'published' then perform public.raise_app('FORBIDDEN'); end if;
  if post.is_locked then perform public.raise_app('LOCKED'); end if;
  delete from public.comment_votes where user_id = auth.uid() and comment_id = p_comment_id;
  if p_value <> 0 then
    insert into public.comment_votes (user_id, comment_id, value) values (auth.uid(), p_comment_id, p_value);
  end if;
  select coalesce(sum(value), 0) into score from public.comment_votes where comment_id = p_comment_id;
  return jsonb_build_object('score', score, 'userVote', p_value);
end;
$$;

create or replace function public.set_saved(p_post_id uuid, p_saved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if not exists (select 1 from public.posts where id = p_post_id and status = 'published') then
    perform public.raise_app('NOT_FOUND');
  end if;
  delete from public.saved_posts where user_id = auth.uid() and post_id = p_post_id;
  if p_saved then insert into public.saved_posts (user_id, post_id) values (auth.uid(), p_post_id); end if;
end;
$$;

create or replace function public.search_content(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  needle text := replace(replace(left(trim(coalesce(p_query, '')), 80), '%', ''), '_', '');
  viewer uuid := auth.uid();
begin
  if char_length(needle) < 2 then
    return jsonb_build_object('communities', '[]'::jsonb, 'posts', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'communities', coalesce((
      select jsonb_agg(public.community_json(c.id, viewer) order by c.name)
      from public.communities c
      where c.is_active and (c.name ilike '%' || needle || '%' or c.description ilike '%' || needle || '%')
    ), '[]'::jsonb),
    'posts', coalesce((
      select jsonb_agg(public.post_json(p.id, viewer) order by p.created_at desc)
      from (
        select id, created_at from public.posts
        where status = 'published'
          and public.can_see_post(id, viewer)
          and search_vector @@ websearch_to_tsquery('english', needle)
        order by created_at desc
        limit 30
      ) p
    ), '[]'::jsonb)
  );
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
    'postId', n.post_id,
    'postType', p.type,
    'commentId', n.comment_id,
    'isRead', n.is_read,
    'createdAt', n.created_at
  ) order by n.created_at desc), '[]'::jsonb)
  from public.notifications n
  left join public.profiles a on a.id = n.actor_id
  left join public.posts p on p.id = n.post_id
  where n.recipient_id = auth.uid()
    and not public.is_blocked(auth.uid(), n.actor_id);
$$;

create or replace function public.mark_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then perform public.raise_app('AUTH_REQUIRED'); end if;
  update public.notifications set is_read = true where id = p_id and recipient_id = auth.uid();
  if not found then perform public.raise_app('NOT_FOUND'); end if;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then perform public.raise_app('AUTH_REQUIRED'); end if;
  update public.notifications set is_read = true where recipient_id = auth.uid() and is_read = false;
end;
$$;

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
  return jsonb_build_object('replies', coalesce(prefs.replies, true), 'mentions', coalesce(prefs.mentions, true));
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
  insert into public.notification_preferences (user_id, replies, mentions)
  values (auth.uid(), coalesce((p_prefs->>'replies')::boolean, true), coalesce((p_prefs->>'mentions')::boolean, true))
  on conflict (user_id) do update set replies = excluded.replies, mentions = excluded.mentions;
end;
$$;

create or replace function public.create_report(p_input jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author uuid;
  target_type public.report_target := (p_input->>'targetType')::public.report_target;
  target_id uuid := (p_input->>'targetId')::uuid;
begin
  perform public.assert_active();
  if target_type = 'post' then
    select author_id into target_author from public.posts where id = target_id;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  else
    select author_id into target_author from public.comments where id = target_id;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  end if;
  if target_author = auth.uid() then perform public.raise_app('SELF_ACTION'); end if;
  perform public.enforce_rate('report', 10);
  insert into public.reports (reporter_id, target_type, target_id, reason, details)
  values (auth.uid(), target_type, target_id, (p_input->>'reason')::public.report_reason, nullif(trim(p_input->>'details'), ''));
exception when invalid_text_representation then
  perform public.raise_app('INVALID_INPUT');
end;
$$;

create or replace function public.set_block(p_user_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_active();
  if p_user_id = auth.uid() then perform public.raise_app('SELF_ACTION'); end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then perform public.raise_app('NOT_FOUND'); end if;
  delete from public.blocked_users where blocker_id = auth.uid() and blocked_id = p_user_id;
  if p_blocked then insert into public.blocked_users (blocker_id, blocked_id) values (auth.uid(), p_user_id); end if;
end;
$$;

create or replace function public.list_blocked()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.profile_json(b.blocked_id)), '[]'::jsonb)
  from public.blocked_users b
  join public.profiles p on p.id = b.blocked_id and p.status <> 'deleted'
  where b.blocker_id = auth.uid();
$$;

create or replace function public.list_saved_posts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.post_json(s.post_id, auth.uid()) order by s.created_at desc), '[]'::jsonb)
  from public.saved_posts s
  join public.posts p on p.id = s.post_id and p.status = 'published'
  where s.user_id = auth.uid() and public.can_see_post(p.id, auth.uid());
$$;

create or replace function public.list_joined_communities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.community_json(m.community_id, auth.uid()) order by c.name), '[]'::jsonb)
  from public.community_memberships m
  join public.communities c on c.id = m.community_id
  where m.user_id = auth.uid();
$$;

create or replace function public.list_profile_posts(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  select id into found_id from public.profiles where lower(username) = lower(p_username) and status <> 'deleted';
  if found_id is null then perform public.raise_app('NOT_FOUND'); end if;
  return coalesce((
    select jsonb_agg(public.post_json(p.id, auth.uid()) order by p.created_at desc)
    from public.posts p
    where p.author_id = found_id and public.can_see_post(p.id, auth.uid()) and p.status = 'published'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.list_profile_comments(p_username text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  found_id uuid;
begin
  select id into found_id from public.profiles where lower(username) = lower(p_username) and status <> 'deleted';
  if found_id is null or public.is_blocked(auth.uid(), found_id) then perform public.raise_app('NOT_FOUND'); end if;
  return coalesce((
    select jsonb_agg(public.comment_json(c.id, auth.uid()) order by c.created_at desc)
    from public.comments c
    where c.author_id = found_id and c.status = 'published'
    limit 100
  ), '[]'::jsonb);
end;
$$;

create or replace function public.get_capabilities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'communityIds', coalesce((select jsonb_agg(community_id) from public.community_moderators where user_id = auth.uid()), '[]'::jsonb),
    'isAdmin', exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
  );
$$;

create or replace function public.report_community(p_type public.report_target, p_target uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_type = 'post' then (select community_id from public.posts where id = p_target)
    else (select p.community_id from public.comments c join public.posts p on p.id = c.post_id where c.id = p_target)
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
    'communityId', public.report_community(r.target_type, r.target_id),
    'communityName', c.name,
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
    'createdAt', a.created_at
  ) order by a.created_at desc), '[]'::jsonb)
  from public.moderation_actions a
  join public.communities c on c.id = a.community_id
  where public.is_moderator(a.community_id, auth.uid());
$$;

create or replace function public.moderate_content(p_input jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  community_id uuid := (p_input->>'communityId')::uuid;
  target_type public.report_target := (p_input->>'targetType')::public.report_target;
  target_id uuid := (p_input->>'targetId')::uuid;
  action text := p_input->>'action';
  reason text := trim(p_input->>'reason');
  report_id uuid := nullif(p_input->>'reportId', '')::uuid;
begin
  perform public.assert_active();
  if not public.is_moderator(community_id, auth.uid()) then perform public.raise_app('FORBIDDEN'); end if;
  if char_length(reason) < 3 then perform public.raise_app('INVALID_INPUT'); end if;
  if action = 'remove' and target_type = 'post' then
    update public.posts set status = 'removed', body = '', deleted_at = now() where id = target_id and community_id = community_id;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif action = 'remove' and target_type = 'comment' then
    update public.comments set status = 'removed', body = '', scripture_references = '[]'::jsonb, deleted_at = now()
    where id = target_id and post_id in (select id from public.posts where community_id = community_id);
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif action in ('lock', 'unlock') then
    update public.posts set is_locked = (action = 'lock') where id = target_id and community_id = community_id;
    if not found then perform public.raise_app('NOT_FOUND'); end if;
  elsif action <> 'dismiss' then
    perform public.raise_app('INVALID_INPUT');
  end if;
  if report_id is not null then
    update public.reports
      set status = case when action = 'dismiss' then 'dismissed'::public.report_status else 'actioned'::public.report_status end,
          resolved_at = now(),
          resolved_by = auth.uid()
      where id = report_id;
  end if;
  insert into public.moderation_actions (moderator_id, community_id, target_type, target_id, action, reason)
  values (auth.uid(), community_id, target_type, target_id, action, reason);
exception when invalid_text_representation then
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
  delete from auth.users where id = uid;
end;
$$;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy avatars_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'avatars');

create policy avatars_owner_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.scripture_books enable row level security;
alter table public.communities enable row level security;
alter table public.community_memberships enable row level security;
alter table public.community_moderators enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.saved_posts enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_users enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.rate_events enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.get_feed(text, uuid, integer, integer),
  public.get_post(uuid),
  public.get_comments(uuid),
  public.search_content(text),
  public.list_communities(),
  public.get_community(text),
  public.get_profile(text),
  public.list_profile_posts(text),
  public.list_profile_comments(text),
  public.get_current_profile()
to anon, authenticated;

grant execute on function
  public.update_own_profile(jsonb),
  public.set_membership(uuid, boolean),
  public.create_post(jsonb),
  public.update_post(uuid, jsonb),
  public.delete_post(uuid),
  public.create_comment(jsonb),
  public.delete_comment(uuid),
  public.cast_post_vote(uuid, smallint),
  public.cast_comment_vote(uuid, smallint),
  public.set_saved(uuid, boolean),
  public.list_notifications(),
  public.mark_notification_read(uuid),
  public.mark_all_notifications_read(),
  public.get_notification_preferences(),
  public.update_notification_preferences(jsonb),
  public.create_report(jsonb),
  public.set_block(uuid, boolean),
  public.list_blocked(),
  public.list_saved_posts(),
  public.list_joined_communities(),
  public.get_capabilities(),
  public.list_reports(),
  public.list_moderation_history(),
  public.moderate_content(jsonb),
  public.delete_own_account()
to authenticated;
