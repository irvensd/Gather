import type {
  ContentStatus,
  NotificationType,
  OnboardingStep,
  PostType,
  ProfileStatus,
  ReportReason,
  ReportTargetType,
  ScriptureReference,
} from '@/types';

export interface DemoUser {
  id: string;
  email: string;
  salt: string;
  passwordHash: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
  status: ProfileStatus;
  onboardingStep: OnboardingStep;
  createdAt: string;
}

export interface DemoPost {
  id: string;
  communityId: string;
  authorId: string | null;
  type: PostType;
  title: string;
  body: string;
  scriptureReferences: ScriptureReference[];
  imageUri?: string | null;
  status: ContentStatus;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoComment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string | null;
  body: string;
  scriptureReferences: ScriptureReference[];
  status: ContentStatus;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoState {
  users: DemoUser[];
  sessionUserId: string | null;
  communities: { id: string; slug: string; name: string; description: string; icon: string; rules: string }[];
  memberships: { userId: string; communityId: string; createdAt: string }[];
  posts: DemoPost[];
  comments: DemoComment[];
  postVotes: { userId: string; postId: string; value: -1 | 1 }[];
  commentVotes: { userId: string; commentId: string; value: -1 | 1 }[];
  saves: { userId: string; postId: string; createdAt: string }[];
  notifications: {
    id: string;
    recipientId: string;
    actorId: string | null;
    type: NotificationType;
    postId: string;
    commentId: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
  reports: {
    id: string;
    reporterId: string | null;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details: string | null;
    status: 'open' | 'dismissed' | 'actioned';
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
  }[];
  blocks: { blockerId: string; blockedId: string; createdAt: string }[];
  moderators: { communityId: string; userId: string }[];
  admins: string[];
  moderationActions: {
    id: string;
    moderatorId: string | null;
    communityId: string;
    targetType: ReportTargetType;
    targetId: string;
    action: string;
    reason: string;
    createdAt: string;
  }[];
  rateEvents: { userId: string; action: string; createdAt: string }[];
  preferences: { userId: string; replies: boolean; mentions: boolean }[];
}
