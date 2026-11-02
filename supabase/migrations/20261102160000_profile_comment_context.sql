-- Profile comment lists say which conversation each comment belongs to.

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
    select jsonb_agg(
      public.comment_json(c.id, auth.uid()) || jsonb_build_object(
        'postTitle', case when p.status = 'published' then p.title else null end,
        'communityName', co.name
      )
      order by c.created_at desc
    )
    from (
      select * from public.comments
      where author_id = found_id and status = 'published'
      order by created_at desc
      limit 100
    ) c
    join public.posts p on p.id = c.post_id
    join public.communities co on co.id = p.community_id
  ), '[]'::jsonb);
end;
$$;
