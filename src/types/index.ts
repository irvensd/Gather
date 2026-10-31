export type PostType = 'question' | 'discussion' | 'testimony' | 'prayer_request';
export type ContentStatus = 'published' | 'removed' | 'deleted';
export type ProfileStatus = 'active' | 'suspended' | 'deleted';
export type OnboardingStep = 'username' | 'interests' | 'done';
export type FeedFilter = 'popular' | 'new' | 'following';
export type CommentSort = 'helpful' | 'newest';
export type VoteValue = -1 | 0 | 1;
export type ReportReason = 'harassment' | 'hate_or_threats' | 'spam_or_scam' | 'personal_information' | 'other';
export type NotificationType = 'post_reply' | 'comment_reply' | 'mention';
export type ReportTargetType = 'post' | 'comment';
export type ModerationActionType = 'remove' | 'lock' | 'unlock' | 'dismiss';

export interface ScriptureReference {
  raw: string;
  book: string;
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface AppSession {
  userId: string;
  email: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
  status: ProfileStatus;
  onboardingStep: OnboardingStep;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rules: string;
  memberCount: number;
  joined: boolean;
  isActive: boolean;
}

export interface PostCard {
  id: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  communityIcon: string;
  authorId: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorAvatarPath: string | null;
  type: PostType;
  title: string;
  body: string;
  scriptureReferences: ScriptureReference[];
  imageUri: string | null;
  status: ContentStatus;
  isLocked: boolean;
  score: number;
  commentCount: number;
  userVote: VoteValue;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorAvatarPath: string | null;
  body: string;
  scriptureReferences: ScriptureReference[];
  status: ContentStatus;
  /** Body is withheld because the viewer blocked this author, or the reverse. */
  concealed: boolean;
  depth: number;
  score: number;
  userVote: VoteValue;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorAvatarPath?: string | null;
  postId: string | null;
  postType: PostType | null;
  postTitle?: string | null;
  postExcerpt?: string | null;
  commentExcerpt?: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string | null;
  reporterUsername: string | null;
  targetType: ReportTargetType;
  targetId: string;
  communityId: string;
  communityName: string;
  reason: ReportReason;
  details: string | null;
  status: 'open' | 'dismissed' | 'actioned';
  excerpt: string;
  createdAt: string;
}

export interface NotificationPreferences {
  replies: boolean;
  mentions: boolean;
}

export interface Capabilities {
  communityIds: string[];
  isAdmin: boolean;
}

export interface Page<T> {
  items: T[];
  nextOffset: number | null;
}

export interface FeedQuery {
  filter: FeedFilter;
  communityId?: string | null;
  offset?: number;
  limit?: number;
}

export interface CreatePostInput {
  communityId: string;
  type: PostType;
  title: string;
  body: string;
  scriptureReferences: ScriptureReference[];
  imageUri?: string | null;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  onboardingStep?: OnboardingStep;
}
