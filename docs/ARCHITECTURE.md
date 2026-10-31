# Gather architecture

One Expo Router application. Presentation lives in `src/app` and `src/components`. Domain rules that do not need React live in `src/lib/domain` and `src/lib/scripture`. All persistence goes through `GatherApi` in `src/lib/backend`.

## Backends

If `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are both set, the app uses Supabase. Otherwise it uses an on-device demo store so the interface can be developed without credentials. The demo banner stays visible in that mode. Demo people, posts, and counts are fictional and are never inserted by SQL.

The publishable key is the only Supabase credential in the app. The service-role key is not an `EXPO_PUBLIC` variable.

Sessions use a large secure store: an AES key in Secure Store and the ciphertext in Async Storage. Auth refresh pauses while the app is backgrounded.

## Data

Tables: profiles, communities, community_memberships, posts, comments, post_votes, comment_votes, saved_posts, notifications, reports, blocked_users, community_moderators, moderation_actions, user_roles, notification_preferences, rate_events, scripture_books.

Clients cannot insert into those tables directly. Row Level Security is on, and table privileges are revoked. Reads and writes go through security-definer functions. `get_capabilities` is the only client signal for moderator or admin status.

Comment insert runs a trigger that writes notifications. The client cannot insert a notification row.

Account deletion is `delete_own_account`. It removes the auth user. Author foreign keys become null, so threads remain and the author renders as a deleted user.

## Feed and comments

Popular ranking is `(score + 1) / (hours + 2) ^ 1.5`. New and Following are newest first. Following is membership, then newest. Pages are offset-based, 15 at a time, because a changing score makes keyset pages unstable.

Comments indent through depth 2. Deeper replies use “View replies”. The server refuses a parent deeper than 6. Deleted leaves disappear. A deleted parent keeps the thread and hides the body.

## Scripture

The client parser and `scripture_books` share KJV chapter verse counts. Verse text is not bundled. The scripture screen requests `translation=web` from bible-api.com and refuses any other translation id.

## Client state

TanStack Query holds server data with a one-minute stale time so switching tabs does not refetch the whole feed. Zustand stores appearance and a pending action to resume after sign-in. Optimistic post votes roll back if the mutation fails.

## Extension points, not built

Notification preferences already exist for a later Expo Notifications build. The schema does not include polls, media, events, verification, or church discovery. Sabbath quiet mode is a future preference, not a current screen.

## Security risks

- A leaked service-role key would bypass RLS. It must stay off the device and out of CI logs.
- Security-definer functions are the trust boundary. A new function needs an explicit execute grant and the same checks as the existing ones.
- Demo mode is not a security boundary. It is local sample data.
- Search strips `%` and `_` before `ILIKE`. Full-text search is the primary index.
- Rate limits live in `rate_events` and are enforced inside the write functions.
- Suspended profiles cannot write. The client also hides the composer, but the database is the check that matters.
- Reports are not readable by the reporter’s peers. Moderators see reports through `list_reports`.
