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
    'postExcerpt', p.body,
    'commentExcerpt', c.body,
    'commentId', n.comment_id,
    'isRead', n.is_read,
    'createdAt', n.created_at
  ) order by n.created_at desc), '[]'::jsonb)
  from public.notifications n
  left join public.profiles a on a.id = n.actor_id
  left join public.posts p on p.id = n.post_id
  left join public.comments c on c.id = n.comment_id
  where n.recipient_id = auth.uid()
    and not public.is_blocked(auth.uid(), n.actor_id);
$$;
