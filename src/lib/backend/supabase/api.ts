import * as Crypto from 'expo-crypto';
import * as ImageManipulator from 'expo-image-manipulator';

import type { GatherApi, ModerationHistoryItem, ModerationInput } from '@/lib/backend/api';
import { mapServerError } from '@/lib/backend/errors';
import { rememberPushToken, rememberedPushToken } from '@/features/notifications/pushToken';
import { postPhotoUri, storedPostPhotoPath } from '@/lib/postPhoto';
import { getSupabase } from '@/lib/supabase/client';
import type {
  AppNotification,
  AppSession,
  Capabilities,
  Comment,
  Community,
  CommunityModerator,
  CreatePostInput,
  FeedQuery,
  NotificationPreferences,
  Page,
  PostCard,
  Profile,
  ReportItem,
  ReportReason,
  ReportTargetType,
  UpdateProfileInput,
  VoteValue,
} from '@/types';

function toSession(session: { user: { id: string; email?: string | null } } | null): AppSession | null {
  if (!session?.user) return null;
  return { userId: session.user.id, email: session.user.email ?? '' };
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args);
  if (error) throw mapServerError(error);
  return data as T;
}

type RawPost = PostCard & { imagePath?: string | null };

function withPhoto(post: RawPost): PostCard {
  const { imagePath, ...rest } = post;
  return { ...rest, imageUri: postPhotoUri(imagePath ?? post.imageUri) };
}

function withPhotos(posts: RawPost[] | null | undefined): PostCard[] {
  return (posts ?? []).map(withPhoto);
}

/** Upload a phone photo into the author's folder. A photo already stored there is kept as its path. */
async function storePostPhoto(uri: string | null | undefined): Promise<string | null> {
  if (!uri) return null;
  const kept = storedPostPhotoPath(uri);
  if (kept) return kept;
  if (/^https?:/i.test(uri)) throw mapServerError(new Error('INVALID_INPUT'));
  const session = await getSupabase().auth.getSession();
  const userId = session.data.session?.user.id;
  if (!userId) throw mapServerError(new Error('AUTH_REQUIRED'));
  const image = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1200 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const response = await fetch(image.uri);
  const bytes = await response.arrayBuffer();
  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  const { error } = await getSupabase().storage.from('post-photos').upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw mapServerError(error);
  return path;
}

async function forgetPostPhoto(path: string | null | undefined) {
  if (!path) return;
  await getSupabase().storage.from('post-photos').remove([path]);
}

export function createSupabaseApi(): GatherApi {
  const auth = () => getSupabase().auth;
  return {
    mode: 'supabase',
    async getSession() {
      const { data, error } = await auth().getSession();
      if (error) throw mapServerError(error);
      return toSession(data.session);
    },
    onAuthChange(listener) {
      const { data } = auth().onAuthStateChange((_event, session) => listener(toSession(session)));
      return () => data.subscription.unsubscribe();
    },
    async signUp(email, password) {
      const { data, error } = await auth().signUp({ email: email.trim(), password });
      if (error) throw mapServerError(error);
      return { session: toSession(data.session), needsEmailConfirmation: !data.session };
    },
    async signIn(email, password) {
      const { data, error } = await auth().signInWithPassword({ email: email.trim(), password });
      if (error) throw mapServerError(error);
      const session = toSession(data.session);
      if (!session) throw mapServerError(new Error('AUTH_REQUIRED'));
      return session;
    },
    async signOut() {
      const token = rememberedPushToken();
      rememberPushToken(null);
      if (token) {
        try {
          await rpc('clear_push_token', { p_token: token });
        } catch {
          // Signing out still proceeds if this phone's token was already removed.
        }
      }
      const { error } = await auth().signOut();
      if (error) throw mapServerError(error);
    },
    async requestPasswordReset(email) {
      const { error } = await auth().resetPasswordForEmail(email.trim(), { redirectTo: 'gather://reset-password' });
      if (error) throw mapServerError(error);
    },
    async updatePassword(password) {
      const { error } = await auth().updateUser({ password });
      if (error) throw mapServerError(error);
    },
    async deleteAccount() {
      await rpc('delete_own_account');
      rememberPushToken(null);
      await auth().signOut();
    },
    getCurrentProfile: () => rpc<Profile | null>('get_current_profile'),
    getProfile: (username) => rpc<Profile>('get_profile', { p_username: username }),
    updateProfile: (input: UpdateProfileInput) => rpc<Profile>('update_own_profile', { p_patch: input }),
    async uploadAvatar(uri: string) {
      const session = await auth().getSession();
      const userId = session.data.session?.user.id;
      if (!userId) throw mapServerError(new Error('AUTH_REQUIRED'));
      const image = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 512 } }], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const response = await fetch(image.uri);
      const bytes = await response.arrayBuffer();
      const path = `${userId}/avatar.jpg`;
      const { error } = await getSupabase().storage.from('avatars').upload(path, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) throw mapServerError(error);
      return rpc<Profile>('update_own_profile', { p_patch: { avatarPath: path } });
    },
    listCommunities: () => rpc<Community[]>('list_communities'),
    getCommunity: (slug) => rpc<Community>('get_community', { p_slug: slug }),
    createCommunity: (input) =>
      rpc<Community>('create_community', {
        p_name: input.name,
        p_description: input.description,
        p_rules: input.rules,
        p_icon: input.icon,
        p_topic: input.topic,
        p_color: input.color,
      }),
    updateCommunity: (id, input) =>
      rpc<Community>('update_community', {
        p_community_id: id,
        p_description: input.description,
        p_rules: input.rules,
        p_icon: input.icon,
        p_color: input.color,
        p_topic: input.topic,
      }),
    listCommunityModerators: (communityId) => rpc<CommunityModerator[]>('list_community_moderators', { p_community_id: communityId }),
    addCommunityModerator: (communityId, username) =>
      rpc<CommunityModerator>('add_community_moderator', { p_community_id: communityId, p_username: username.trim().replace(/^@/, '') }),
    async removeCommunityModerator(communityId, userId) {
      await rpc('remove_community_moderator', { p_community_id: communityId, p_user_id: userId });
    },
    async setMembership(communityId, join) {
      await rpc('set_membership', { p_community_id: communityId, p_join: join });
    },
    async getFeed(query: FeedQuery) {
      const page = await rpc<Page<RawPost>>('get_feed', {
        p_filter: query.filter,
        p_community_id: query.communityId ?? null,
        p_offset: query.offset ?? 0,
        p_limit: query.limit ?? 15,
      });
      return { ...page, items: withPhotos(page.items) };
    },
    async getPost(id) {
      return withPhoto(await rpc<RawPost>('get_post', { p_post_id: id }));
    },
    async createPost(input: CreatePostInput) {
      const { imageUri, ...rest } = input;
      const imagePath = await storePostPhoto(imageUri);
      return withPhoto(await rpc<RawPost>('create_post', { p_input: { ...rest, imagePath } }));
    },
    async updatePost(id, input) {
      const imagePath = await storePostPhoto(input.imageUri);
      const previous = await rpc<RawPost>('get_post', { p_post_id: id });
      const updated = withPhoto(
        await rpc<RawPost>('update_post', {
          p_post_id: id,
          p_input: { title: input.title, body: input.body, scriptureReferences: input.scriptureReferences, imagePath },
        }),
      );
      const previousPath = previous.imagePath ?? storedPostPhotoPath(previous.imageUri);
      if (previousPath && previousPath !== imagePath) {
        try {
          await forgetPostPhoto(previousPath);
        } catch {
          // The post already points at the new photo. A leftover file can be removed with the account.
        }
      }
      return updated;
    },
    async deletePost(id) {
      await rpc('delete_post', { p_post_id: id });
    },
    getComments: (postId) => rpc<Comment[]>('get_comments', { p_post_id: postId }),
    createComment: (input) => rpc<Comment>('create_comment', { p_input: input }),
    async deleteComment(id) {
      await rpc('delete_comment', { p_comment_id: id });
    },
    votePost: (postId, value: VoteValue) => rpc('cast_post_vote', { p_post_id: postId, p_value: value }),
    voteComment: (commentId, value: VoteValue) => rpc('cast_comment_vote', { p_comment_id: commentId, p_value: value }),
    async setSaved(postId, saved) {
      await rpc('set_saved', { p_post_id: postId, p_saved: saved });
    },
    async setPrayed(postId, prayed) {
      await rpc('set_prayed', { p_post_id: postId, p_prayed: prayed });
    },
    async search(query) {
      const result = await rpc<{ communities: Community[]; posts: RawPost[] | null }>('search_content', { p_query: query });
      return { communities: result.communities ?? [], posts: withPhotos(result.posts) };
    },
    listNotifications: () => rpc<AppNotification[]>('list_notifications'),
    async markNotificationRead(id) {
      await rpc('mark_notification_read', { p_id: id });
    },
    async markAllNotificationsRead() {
      await rpc('mark_all_notifications_read');
    },
    getNotificationPreferences: () => rpc<NotificationPreferences>('get_notification_preferences'),
    async updateNotificationPreferences(preferences) {
      await rpc('update_notification_preferences', { p_prefs: preferences });
    },
    async registerPushToken(token: string) {
      await rpc('register_push_token', { p_token: token });
    },
    async clearPushToken(token: string) {
      await rpc('clear_push_token', { p_token: token });
    },
    async report(input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; details?: string }) {
      await rpc('create_report', { p_input: input });
    },
    async setBlocked(userId, blocked) {
      await rpc('set_block', { p_user_id: userId, p_blocked: blocked });
    },
    listBlocked: () => rpc<Profile[]>('list_blocked'),
    async listSavedPosts() {
      return withPhotos(await rpc<RawPost[] | null>('list_saved_posts'));
    },
    listJoinedCommunities: () => rpc<Community[]>('list_joined_communities'),
    async listProfilePosts(username) {
      return withPhotos(await rpc<RawPost[] | null>('list_profile_posts', { p_username: username }));
    },
    listProfileComments: (username) => rpc<Comment[]>('list_profile_comments', { p_username: username }),
    getCapabilities: () => rpc<Capabilities>('get_capabilities'),
    listReports: () => rpc<ReportItem[]>('list_reports'),
    listModerationHistory: () => rpc<ModerationHistoryItem[]>('list_moderation_history'),
    async moderate(input: ModerationInput) {
      await rpc('moderate_content', { p_input: input });
    },
  };
}
