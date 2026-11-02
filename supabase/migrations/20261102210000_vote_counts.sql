-- The middle number was likes minus dislikes, so one of each showed as 0.
-- Each post and comment now also reports the two counts on their own.

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
    'upvotes', (select count(*) from public.post_votes v where v.post_id = p.id and v.value = 1),
    'downvotes', (select count(*) from public.post_votes v where v.post_id = p.id and v.value = -1),
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
    'upvotes', (select count(*) from public.comment_votes v where v.comment_id = c.id and v.value = 1),
    'downvotes', (select count(*) from public.comment_votes v where v.comment_id = c.id and v.value = -1),
    'userVote', coalesce((select value from public.comment_votes v where v.comment_id = c.id and v.user_id = p_viewer), 0),
    'createdAt', c.created_at
  );
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
  upvotes integer;
  downvotes integer;
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
  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1),
    coalesce(sum(value), 0)
  into upvotes, downvotes, score
  from public.post_votes
  where post_id = p_post_id;
  return jsonb_build_object('score', score, 'upvotes', upvotes, 'downvotes', downvotes, 'userVote', p_value);
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
  upvotes integer;
  downvotes integer;
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
  select
    count(*) filter (where value = 1),
    count(*) filter (where value = -1),
    coalesce(sum(value), 0)
  into upvotes, downvotes, score
  from public.comment_votes
  where comment_id = p_comment_id;
  return jsonb_build_object('score', score, 'upvotes', upvotes, 'downvotes', downvotes, 'userVote', p_value);
end;
$$;
