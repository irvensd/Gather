import type {
  AppNotification,
  AppSession,
  Capabilities,
  Comment,
  Community,
  CreatePostInput,
  FeedQuery,
  NotificationPreferences,
  Page,
  PostCard,
  Profile,
  ReportItem,
  ReportReason,
  ReportTargetType,
  ScriptureReference,
  UpdateProfileInput,
  VoteValue,
} from '@/types';

export interface ModerationInput {
  reportId?: string | null;
  communityId: string;
  targetType: ReportTargetType;
  targetId: string;
  action: 'remove' | 'lock' | 'unlock' | 'dismiss';
  reason: string;
}

export interface ModerationHistoryItem {
  id: string;
  action: string;
  reason: string;
  targetType: ReportTargetType;
  targetId: string;
  communityName: string;
  createdAt: string;
}

export interface GatherApi {
  mode: 'demo' | 'supabase';
  getSession(): Promise<AppSession | null>;
  onAuthChange(listener: (session: AppSession | null) => void): () => void;
  signUp(email: string, password: string): Promise<{ session: AppSession | null; needsEmailConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<AppSession>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  deleteAccount(): Promise<void>;
  getCurrentProfile(): Promise<Profile | null>;
  getProfile(username: string): Promise<Profile>;
  updateProfile(input: UpdateProfileInput): Promise<Profile>;
  uploadAvatar(uri: string): Promise<Profile>;
  listCommunities(): Promise<Community[]>;
  getCommunity(slug: string): Promise<Community>;
  createCommunity(input: { name: string; description: string; rules: string; icon: string }): Promise<Community>;
  setMembership(communityId: string, join: boolean): Promise<void>;
  getFeed(query: FeedQuery): Promise<Page<PostCard>>;
  getPost(id: string): Promise<PostCard>;
  createPost(input: CreatePostInput): Promise<PostCard>;
  updatePost(id: string, input: { title: string; body: string; scriptureReferences: ScriptureReference[]; imageUri?: string | null }): Promise<PostCard>;
  deletePost(id: string): Promise<void>;
  getComments(postId: string): Promise<Comment[]>;
  createComment(input: {
    postId: string;
    parentCommentId?: string | null;
    body: string;
    scriptureReferences: ScriptureReference[];
  }): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  votePost(postId: string, value: VoteValue): Promise<{ score: number; userVote: VoteValue }>;
  voteComment(commentId: string, value: VoteValue): Promise<{ score: number; userVote: VoteValue }>;
  setSaved(postId: string, saved: boolean): Promise<void>;
  search(query: string): Promise<{ communities: Community[]; posts: PostCard[] }>;
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  updateNotificationPreferences(preferences: NotificationPreferences): Promise<void>;
  report(input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; details?: string }): Promise<void>;
  setBlocked(userId: string, blocked: boolean): Promise<void>;
  listBlocked(): Promise<Profile[]>;
  listSavedPosts(): Promise<PostCard[]>;
  listJoinedCommunities(): Promise<Community[]>;
  listProfilePosts(username: string): Promise<PostCard[]>;
  listProfileComments(username: string): Promise<Comment[]>;
  getCapabilities(): Promise<Capabilities>;
  listReports(): Promise<ReportItem[]>;
  listModerationHistory(): Promise<ModerationHistoryItem[]>;
  moderate(input: ModerationInput): Promise<void>;
}
