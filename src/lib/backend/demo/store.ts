import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { LIMITS } from '@/constants/limits';
import type { GatherApi, ModerationInput } from '@/lib/backend/api';
import { AppError } from '@/lib/backend/errors';
import { createSeed } from '@/lib/backend/demo/seed';
import type { DemoComment, DemoPost, DemoState, DemoUser } from '@/lib/backend/demo/types';
import { wouldExceedDepth } from '@/lib/domain/comments';
import { sortFeed } from '@/lib/domain/feed';
import { allowsNotification, commentNotificationIntents, extractMentions } from '@/lib/domain/notifications';
import { paginate } from '@/lib/domain/pagination';
import { canEditOwnContent, canModerate, canVote, canWrite, postVisibility } from '@/lib/domain/permissions';
import { isRateLimited } from '@/lib/domain/rateLimit';
import { COMMUNITY_ICONS, communitySlug, validateCommunityName } from '@/lib/domain/community';
import { validateUsername } from '@/lib/domain/username';
import { mergeReferences, validateReference } from '@/lib/scripture/parse';
import { commentSchema, postSchema, reportSchema, signInSchema, signUpSchema } from '@/lib/validation/schemas';
import type {
  AppNotification,
  AppSession,
  Comment,
  Community,
  CreatePostInput,
  FeedQuery,
  PostCard,
  Profile,
  ReportItem,
  ScriptureReference,
  UpdateProfileInput,
  VoteValue,
} from '@/types';

const STORAGE_KEY = 'gather.demo.v1';
const HOUR = 3_600_000;

async function hashPassword(salt: string, password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function assertScripture(references: ScriptureReference[]) {
  for (const reference of references) {
    const valid = validateReference(reference.book, reference.chapter, reference.verseStart, reference.verseEnd);
    if (!valid) throw new AppError('One of the Scripture references is not valid.', 'validation');
  }
}

export class DemoStore implements GatherApi {
  readonly mode = 'demo' as const;
  private state: DemoState = createSeed();
  private ready: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private listeners = new Set<(session: AppSession | null) => void>();

  constructor() {
    this.ready = this.load();
  }

  private async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) this.state = JSON.parse(raw) as DemoState;
    } catch {
      this.state = createSeed();
    }
  }

  private async persist() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      await this.ready;
      return work();
    });
    this.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private session(): AppSession | null {
    const user = this.state.users.find((item) => item.id === this.state.sessionUserId);
    if (!user || user.status === 'deleted') return null;
    return { userId: user.id, email: user.email };
  }

  private emit() {
    const session = this.session();
    for (const listener of this.listeners) listener(session);
  }

  private requireUser(): DemoUser {
    const user = this.state.users.find((item) => item.id === this.state.sessionUserId);
    if (!user) throw new AppError('AUTH_REQUIRED', 'auth');
    if (!canWrite(user.status)) throw new AppError('SUSPENDED', 'suspended');
    return user;
  }

  private blocked(a: string | null, b: string | null) {
    if (!a || !b) return false;
    return this.state.blocks.some(
      (block) => (block.blockerId === a && block.blockedId === b) || (block.blockerId === b && block.blockedId === a),
    );
  }

  private mayModerate(communityId: string, caps: { communityIds: readonly string[]; isAdmin: boolean }) {
    return canModerate({ communityId, moderatorCommunityIds: caps.communityIds, isAdmin: caps.isAdmin });
  }

  private capabilitiesFor(userId: string | null) {
    if (!userId) return { communityIds: [] as string[], isAdmin: false };
    return {
      communityIds: this.state.moderators.filter((mod) => mod.userId === userId).map((mod) => mod.communityId),
      isAdmin: this.state.admins.includes(userId),
    };
  }

  private profile(user: DemoUser | undefined, viewerId: string | null): Profile {
    if (!user || user.status === 'deleted') {
      return {
        id: user?.id ?? 'deleted',
        username: 'deleted',
        displayName: 'Deleted user',
        bio: null,
        avatarPath: null,
        status: 'deleted',
        onboardingStep: 'done',
        createdAt: user?.createdAt ?? new Date(0).toISOString(),
        postCount: 0,
        commentCount: 0,
      };
    }
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarPath: user.avatarPath,
      status: user.status,
      onboardingStep: user.onboardingStep,
      createdAt: user.createdAt,
      postCount: this.state.posts.filter((post) => post.authorId === user.id && post.status === 'published').length,
      commentCount: this.state.comments.filter((comment) => comment.authorId === user.id && comment.status === 'published').length,
      ...(viewerId ? {} : {}),
    };
  }

  private community(id: string, viewerId: string | null): Community {
    const community = this.state.communities.find((item) => item.id === id);
    if (!community) throw new AppError('NOT_FOUND', 'not_found');
    return {
      ...community,
      memberCount: this.state.memberships.filter((membership) => membership.communityId === id).length,
      joined: !!viewerId && this.state.memberships.some((membership) => membership.communityId === id && membership.userId === viewerId),
      isActive: true,
    };
  }

  private postCard(post: DemoPost, viewerId: string | null): PostCard {
    const author = this.state.users.find((user) => user.id === post.authorId);
    const community = this.community(post.communityId, viewerId);
    const votes = this.state.postVotes.filter((vote) => vote.postId === post.id);
    const mine = votes.find((vote) => vote.userId === viewerId);
    return {
      id: post.id,
      communityId: community.id,
      communitySlug: community.slug,
      communityName: community.name,
      communityIcon: community.icon,
      authorId: author && author.status !== 'deleted' ? author.id : null,
      authorUsername: author && author.status !== 'deleted' ? author.username : null,
      authorDisplayName: author && author.status !== 'deleted' ? author.displayName : null,
      authorAvatarPath: author && author.status !== 'deleted' ? author.avatarPath : null,
      type: post.type,
      title: post.title,
      body: post.status === 'published' ? post.body : '',
      scriptureReferences: post.status === 'published' ? post.scriptureReferences : [],
      imageUri: post.status === 'published' ? (post.imageUri ?? null) : null,
      status: post.status,
      isLocked: post.isLocked,
      score: votes.reduce((sum, vote) => sum + vote.value, 0),
      commentCount: this.state.comments.filter((comment) => comment.postId === post.id && comment.status === 'published').length,
      userVote: mine?.value ?? 0,
      saved: !!viewerId && this.state.saves.some((save) => save.userId === viewerId && save.postId === post.id),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private visiblePosts(viewerId: string | null): DemoPost[] {
    const caps = this.capabilitiesFor(viewerId);
    return this.state.posts.filter((post) => {
      const visibility = postVisibility({
        status: post.status,
        authorId: post.authorId,
        viewerId,
        blocked: this.blocked(viewerId, post.authorId),
        canModerate: this.mayModerate(post.communityId, caps),
      });
      return visibility === 'full';
    });
  }

  private commentCard(comment: DemoComment, viewerId: string | null): Comment {
    const author = this.state.users.find((user) => user.id === comment.authorId);
    const concealed = this.blocked(viewerId, comment.authorId);
    const votes = this.state.commentVotes.filter((vote) => vote.commentId === comment.id);
    const published = comment.status === 'published' && !concealed;
    return {
      id: comment.id,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      authorId: published && author && author.status !== 'deleted' ? author.id : null,
      authorUsername: published && author && author.status !== 'deleted' ? author.username : null,
      authorDisplayName: published && author && author.status !== 'deleted' ? author.displayName : null,
      authorAvatarPath: published && author && author.status !== 'deleted' ? author.avatarPath : null,
      body: published ? comment.body : '',
      scriptureReferences: published ? comment.scriptureReferences : [],
      status: concealed ? 'removed' : comment.status,
      concealed,
      depth: comment.depth,
      score: votes.reduce((sum, vote) => sum + vote.value, 0),
      userVote: votes.find((vote) => vote.userId === viewerId)?.value ?? 0,
      createdAt: comment.createdAt,
    };
  }

  private guardRate(userId: string, action: string, max: number) {
    if (isRateLimited(this.state.rateEvents, action, max, HOUR)) throw new AppError('RATE_LIMIT', 'rate_limit');
    this.state.rateEvents.push({ userId, action, createdAt: new Date().toISOString() });
  }

  private notifyFromComment(comment: DemoComment, actorId: string) {
    const post = this.state.posts.find((item) => item.id === comment.postId);
    if (!post) return;
    const parent = comment.parentCommentId ? this.state.comments.find((item) => item.id === comment.parentCommentId) : undefined;
    const mentioned = extractMentions(comment.body)
      .map((username) => this.state.users.find((user) => user.username.toLowerCase() === username && user.status === 'active')?.id)
      .filter((id): id is string => !!id);
    const intents = commentNotificationIntents({
      actorId,
      postAuthorId: post.authorId,
      parentAuthorId: parent?.authorId ?? null,
      mentionedUserIds: mentioned,
    });
    for (const intent of intents) {
      if (this.blocked(actorId, intent.recipientId)) continue;
      const preferences = this.state.preferences.find((item) => item.userId === intent.recipientId) ?? { replies: true, mentions: true };
      if (!allowsNotification(intent.type, preferences)) continue;
      this.state.notifications.unshift({
        id: Crypto.randomUUID(),
        recipientId: intent.recipientId,
        actorId,
        type: intent.type,
        postId: post.id,
        commentId: comment.id,
        isRead: false,
        createdAt: comment.createdAt,
      });
    }
  }

  getSession() {
    return this.enqueue(async () => this.session());
  }

  onAuthChange(listener: (session: AppSession | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  signUp(email: string, password: string) {
    return this.enqueue(async () => {
      const parsed = signUpSchema.safeParse({ email, password, confirmPassword: password });
      if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? 'INVALID_INPUT', 'validation');
      const normalized = email.trim().toLowerCase();
      if (this.state.users.some((user) => user.email === normalized && user.status !== 'deleted')) {
        throw new AppError('An account with that email already exists.', 'conflict');
      }
      const id = Crypto.randomUUID();
      const salt = Crypto.randomUUID();
      const user: DemoUser = {
        id,
        email: normalized,
        salt,
        passwordHash: await hashPassword(salt, password),
        username: `user_${id.replaceAll('-', '').slice(0, 12)}`,
        displayName: null,
        bio: null,
        avatarPath: null,
        status: 'active',
        onboardingStep: 'username',
        createdAt: new Date().toISOString(),
      };
      this.state.users.push(user);
      this.state.preferences.push({ userId: id, replies: true, mentions: true });
      this.state.sessionUserId = id;
      await this.persist();
      this.emit();
      return { session: this.session(), needsEmailConfirmation: false };
    });
  }

  signIn(email: string, password: string) {
    return this.enqueue(async () => {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? 'INVALID_INPUT', 'validation');
      const user = this.state.users.find((item) => item.email === email.trim().toLowerCase() && item.status !== 'deleted');
      const hash = user ? await hashPassword(user.salt, password) : '';
      if (!user || hash !== user.passwordHash) throw new AppError('Email or password is incorrect.', 'auth');
      if (user.status === 'suspended') throw new AppError('SUSPENDED', 'suspended');
      this.state.sessionUserId = user.id;
      await this.persist();
      this.emit();
      const session = this.session();
      if (!session) throw new AppError('AUTH_REQUIRED', 'auth');
      return session;
    });
  }

  signOut() {
    return this.enqueue(async () => {
      this.state.sessionUserId = null;
      await this.persist();
      this.emit();
    });
  }

  requestPasswordReset() {
    return this.enqueue(async () => {
      throw new AppError('This sample space is not connected to email. Use the demo password or create an account on this device.', 'validation');
    });
  }

  updatePassword(password: string) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      if (password.length < 8) throw new AppError('Use at least 8 characters.', 'validation');
      user.salt = Crypto.randomUUID();
      user.passwordHash = await hashPassword(user.salt, password);
      await this.persist();
    });
  }

  deleteAccount() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      for (const post of this.state.posts) if (post.authorId === user.id) post.authorId = null;
      for (const comment of this.state.comments) if (comment.authorId === user.id) comment.authorId = null;
      this.state.postVotes = this.state.postVotes.filter((vote) => vote.userId !== user.id);
      this.state.commentVotes = this.state.commentVotes.filter((vote) => vote.userId !== user.id);
      this.state.saves = this.state.saves.filter((save) => save.userId !== user.id);
      this.state.memberships = this.state.memberships.filter((membership) => membership.userId !== user.id);
      this.state.blocks = this.state.blocks.filter((block) => block.blockerId !== user.id && block.blockedId !== user.id);
      this.state.notifications = this.state.notifications.filter((item) => item.recipientId !== user.id && item.actorId !== user.id);
      this.state.moderators = this.state.moderators.filter((mod) => mod.userId !== user.id);
      this.state.admins = this.state.admins.filter((id) => id !== user.id);
      for (const report of this.state.reports) if (report.reporterId === user.id) report.reporterId = null;
      user.status = 'deleted';
      user.username = `deleted_${user.id.slice(0, 8)}`;
      user.displayName = null;
      user.bio = null;
      user.avatarPath = null;
      user.email = `deleted-${user.id}@example.invalid`;
      user.passwordHash = '';
      this.state.sessionUserId = null;
      await this.persist();
      this.emit();
    });
  }

  getCurrentProfile() {
    return this.enqueue(async () => {
      const session = this.session();
      if (!session) return null;
      const user = this.state.users.find((item) => item.id === session.userId);
      return user ? this.profile(user, session.userId) : null;
    });
  }

  getProfile(username: string) {
    return this.enqueue(async () => {
      const user = this.state.users.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.status !== 'deleted');
      if (!user || this.blocked(this.state.sessionUserId, user.id)) throw new AppError('NOT_FOUND', 'not_found');
      return this.profile(user, this.state.sessionUserId);
    });
  }

  updateProfile(input: UpdateProfileInput) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      if (input.username) {
        const message = validateUsername(input.username);
        if (message) throw new AppError(message, 'validation');
        const taken = this.state.users.some(
          (item) => item.id !== user.id && item.status !== 'deleted' && item.username.toLowerCase() === input.username!.toLowerCase(),
        );
        if (taken) throw new AppError('USERNAME_TAKEN', 'conflict');
        user.username = input.username.trim();
      }
      if (input.displayName !== undefined) user.displayName = input.displayName?.trim() || null;
      if (input.bio !== undefined) user.bio = input.bio?.trim() || null;
      if (input.avatarPath !== undefined) user.avatarPath = input.avatarPath;
      if (input.onboardingStep) user.onboardingStep = input.onboardingStep;
      await this.persist();
      return this.profile(user, user.id);
    });
  }

  uploadAvatar(uri: string) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      user.avatarPath = uri;
      await this.persist();
      return this.profile(user, user.id);
    });
  }

  listCommunities() {
    return this.enqueue(async () => this.state.communities.map((community) => this.community(community.id, this.state.sessionUserId)));
  }

  getCommunity(slug: string) {
    return this.enqueue(async () => {
      const community = this.state.communities.find((item) => item.slug === slug);
      if (!community) throw new AppError('NOT_FOUND', 'not_found');
      return this.community(community.id, this.state.sessionUserId);
    });
  }

  createCommunity(input: { name: string; description: string; rules: string; icon: string }) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const message = validateCommunityName(input.name);
      if (message) throw new AppError(message, 'validation');
      const name = input.name.trim().replace(/\s+/g, ' ');
      const description = input.description.trim();
      const rules = input.rules.trim();
      if (description.length < LIMITS.communityDescriptionMin || description.length > LIMITS.communityDescriptionMax) {
        throw new AppError(`Describe the community in ${LIMITS.communityDescriptionMin}–${LIMITS.communityDescriptionMax} characters.`, 'validation');
      }
      if (rules.length > LIMITS.communityRulesMax) throw new AppError('The rules are too long.', 'validation');
      if (!COMMUNITY_ICONS.includes(input.icon as (typeof COMMUNITY_ICONS)[number])) throw new AppError('Choose an icon.', 'validation');
      const slug = communitySlug(name);
      const taken = this.state.communities.some(
        (community) => community.slug === slug || community.name.toLowerCase() === name.toLowerCase(),
      );
      if (taken) throw new AppError('A community with that name already exists.', 'conflict');
      this.guardRate(user.id, 'community', LIMITS.communitiesPerHour);
      const id = Crypto.randomUUID();
      const now = new Date().toISOString();
      this.state.communities.push({
        id,
        slug,
        name,
        description,
        icon: input.icon,
        rules: rules || 'Be respectful. Disagree with ideas, not people. Do not share someone else’s private information.',
      });
      this.state.memberships.push({ userId: user.id, communityId: id, createdAt: now });
      this.state.moderators.push({ communityId: id, userId: user.id });
      await this.persist();
      return this.community(id, user.id);
    });
  }

  setMembership(communityId: string, join: boolean) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      if (!this.state.communities.some((community) => community.id === communityId)) throw new AppError('NOT_FOUND', 'not_found');
      this.state.memberships = this.state.memberships.filter((membership) => !(membership.userId === user.id && membership.communityId === communityId));
      if (join) this.state.memberships.push({ userId: user.id, communityId, createdAt: new Date().toISOString() });
      await this.persist();
    });
  }

  getFeed(query: FeedQuery) {
    return this.enqueue(async () => {
      const viewerId = this.state.sessionUserId;
      let posts = this.visiblePosts(viewerId);
      if (query.communityId) posts = posts.filter((post) => post.communityId === query.communityId);
      if (query.filter === 'following') {
        if (!viewerId) return { items: [], nextOffset: null };
        const joined = new Set(this.state.memberships.filter((membership) => membership.userId === viewerId).map((membership) => membership.communityId));
        posts = posts.filter((post) => joined.has(post.communityId));
      }
      const cards = sortFeed(
        posts.map((post) => this.postCard(post, viewerId)),
        query.filter === 'following' ? 'new' : query.filter,
      );
      return paginate(cards, query.offset ?? 0, query.limit ?? LIMITS.pageSize);
    });
  }

  getPost(id: string) {
    return this.enqueue(async () => {
      const post = this.state.posts.find((item) => item.id === id);
      if (!post) throw new AppError('NOT_FOUND', 'not_found');
      const caps = this.capabilitiesFor(this.state.sessionUserId);
      const visibility = postVisibility({
        status: post.status,
        authorId: post.authorId,
        viewerId: this.state.sessionUserId,
        blocked: this.blocked(this.state.sessionUserId, post.authorId),
        canModerate: this.mayModerate(post.communityId, caps),
      });
      if (visibility === 'hidden') throw new AppError('NOT_FOUND', 'not_found');
      return this.postCard(post, this.state.sessionUserId);
    });
  }

  createPost(input: CreatePostInput) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const parsed = postSchema.safeParse(input);
      if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? 'INVALID_INPUT', 'validation');
      if (!this.state.communities.some((community) => community.id === input.communityId)) throw new AppError('NOT_FOUND', 'not_found');
      const scriptureReferences = mergeReferences(input.scriptureReferences, input.body);
      assertScripture(scriptureReferences);
      this.guardRate(user.id, 'post', LIMITS.postsPerHour);
      const now = new Date().toISOString();
      const post: DemoPost = {
        id: Crypto.randomUUID(),
        communityId: input.communityId,
        authorId: user.id,
        type: input.type,
        title: input.title.trim(),
        body: input.body.trim(),
        scriptureReferences,
        imageUri: input.imageUri ?? null,
        status: 'published',
        isLocked: false,
        createdAt: now,
        updatedAt: now,
      };
      this.state.posts.unshift(post);
      await this.persist();
      return this.postCard(post, user.id);
    });
  }

  updatePost(id: string, input: { title: string; body: string; scriptureReferences: ScriptureReference[]; imageUri?: string | null }) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const post = this.state.posts.find((item) => item.id === id);
      if (!post) throw new AppError('NOT_FOUND', 'not_found');
      if (!canEditOwnContent({ authorId: post.authorId, viewerId: user.id, contentStatus: post.status, isLocked: post.isLocked })) {
        throw new AppError('FORBIDDEN', 'forbidden');
      }
      const scriptureReferences = mergeReferences(input.scriptureReferences, input.body);
      assertScripture(scriptureReferences);
      if (input.title.trim().length < LIMITS.titleMin || input.body.trim().length < 1) throw new AppError('INVALID_INPUT', 'validation');
      post.title = input.title.trim();
      post.body = input.body.trim();
      post.scriptureReferences = scriptureReferences;
      if (input.imageUri !== undefined) post.imageUri = input.imageUri;
      post.updatedAt = new Date().toISOString();
      await this.persist();
      return this.postCard(post, user.id);
    });
  }

  deletePost(id: string) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const post = this.state.posts.find((item) => item.id === id);
      if (!post || post.authorId !== user.id) throw new AppError('FORBIDDEN', 'forbidden');
      post.status = 'deleted';
      post.updatedAt = new Date().toISOString();
      await this.persist();
    });
  }

  getComments(postId: string) {
    return this.enqueue(async () => {
      if (!this.state.posts.some((post) => post.id === postId)) throw new AppError('NOT_FOUND', 'not_found');
      return this.state.comments.filter((comment) => comment.postId === postId).map((comment) => this.commentCard(comment, this.state.sessionUserId));
    });
  }

  createComment(input: { postId: string; parentCommentId?: string | null; body: string; scriptureReferences: ScriptureReference[] }) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const parsed = commentSchema.safeParse({ body: input.body, scriptureReferences: input.scriptureReferences });
      if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? 'INVALID_INPUT', 'validation');
      const post = this.state.posts.find((item) => item.id === input.postId);
      if (!post || post.status !== 'published') throw new AppError('NOT_FOUND', 'not_found');
      if (post.isLocked) throw new AppError('LOCKED', 'locked');
      if (this.blocked(user.id, post.authorId)) throw new AppError('FORBIDDEN', 'forbidden');
      const parent = input.parentCommentId ? this.state.comments.find((item) => item.id === input.parentCommentId) : undefined;
      if (input.parentCommentId && (!parent || parent.postId !== post.id)) throw new AppError('INVALID_INPUT', 'validation');
      if (wouldExceedDepth(parent ? parent.depth : null)) throw new AppError('MAX_DEPTH', 'validation');
      const scriptureReferences = mergeReferences(input.scriptureReferences, input.body);
      assertScripture(scriptureReferences);
      this.guardRate(user.id, 'comment', LIMITS.commentsPerHour);
      const now = new Date().toISOString();
      const comment: DemoComment = {
        id: Crypto.randomUUID(),
        postId: post.id,
        parentCommentId: parent?.id ?? null,
        authorId: user.id,
        body: input.body.trim(),
        scriptureReferences,
        status: 'published',
        depth: parent ? parent.depth + 1 : 0,
        createdAt: now,
        updatedAt: now,
      };
      this.state.comments.push(comment);
      this.notifyFromComment(comment, user.id);
      await this.persist();
      return this.commentCard(comment, user.id);
    });
  }

  deleteComment(id: string) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const comment = this.state.comments.find((item) => item.id === id);
      if (!comment || comment.authorId !== user.id) throw new AppError('FORBIDDEN', 'forbidden');
      comment.status = 'deleted';
      comment.body = '';
      comment.scriptureReferences = [];
      comment.updatedAt = new Date().toISOString();
      await this.persist();
    });
  }

  private setVote(kind: 'post' | 'comment', id: string, value: VoteValue) {
    const user = this.requireUser();
    if (value !== -1 && value !== 0 && value !== 1) throw new AppError('INVALID_INPUT', 'validation');
    if (kind === 'post') {
      const post = this.state.posts.find((item) => item.id === id);
      if (!post) throw new AppError('NOT_FOUND', 'not_found');
      if (!canVote({ profileStatus: user.status, contentStatus: post.status, isLocked: post.isLocked })) {
        throw new AppError(post.isLocked ? 'LOCKED' : 'FORBIDDEN', post.isLocked ? 'locked' : 'forbidden');
      }
      this.state.postVotes = this.state.postVotes.filter((vote) => !(vote.userId === user.id && vote.postId === id));
      if (value !== 0) this.state.postVotes.push({ userId: user.id, postId: id, value });
      const score = this.state.postVotes.filter((vote) => vote.postId === id).reduce((sum, vote) => sum + vote.value, 0);
      return { score, userVote: value };
    }
    const comment = this.state.comments.find((item) => item.id === id);
    const post = comment ? this.state.posts.find((item) => item.id === comment.postId) : undefined;
    if (!comment || !post) throw new AppError('NOT_FOUND', 'not_found');
    if (!canVote({ profileStatus: user.status, contentStatus: comment.status === 'published' && post.status === 'published' ? 'published' : 'removed', isLocked: post.isLocked })) {
      throw new AppError(post.isLocked ? 'LOCKED' : 'FORBIDDEN', post.isLocked ? 'locked' : 'forbidden');
    }
    this.state.commentVotes = this.state.commentVotes.filter((vote) => !(vote.userId === user.id && vote.commentId === id));
    if (value !== 0) this.state.commentVotes.push({ userId: user.id, commentId: id, value });
    const score = this.state.commentVotes.filter((vote) => vote.commentId === id).reduce((sum, vote) => sum + vote.value, 0);
    return { score, userVote: value };
  }

  votePost(postId: string, value: VoteValue) {
    return this.enqueue(async () => {
      const result = this.setVote('post', postId, value);
      await this.persist();
      return result;
    });
  }

  voteComment(commentId: string, value: VoteValue) {
    return this.enqueue(async () => {
      const result = this.setVote('comment', commentId, value);
      await this.persist();
      return result;
    });
  }

  setSaved(postId: string, saved: boolean) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      if (!this.state.posts.some((post) => post.id === postId && post.status === 'published')) throw new AppError('NOT_FOUND', 'not_found');
      this.state.saves = this.state.saves.filter((save) => !(save.userId === user.id && save.postId === postId));
      if (saved) this.state.saves.push({ userId: user.id, postId, createdAt: new Date().toISOString() });
      await this.persist();
    });
  }

  search(query: string) {
    return this.enqueue(async () => {
      const needle = query.trim().toLowerCase();
      if (needle.length < 2) return { communities: [], posts: [] };
      const viewerId = this.state.sessionUserId;
      const communities = this.state.communities
        .filter((community) => `${community.name} ${community.description}`.toLowerCase().includes(needle))
        .map((community) => this.community(community.id, viewerId));
      const posts = this.visiblePosts(viewerId)
        .filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(needle))
        .map((post) => this.postCard(post, viewerId))
        .slice(0, 30);
      return { communities, posts };
    });
  }

  listNotifications() {
    return this.enqueue(async () => {
      const user = this.state.sessionUserId;
      if (!user) return [];
      return this.state.notifications
        .filter((item) => item.recipientId === user && !this.blocked(user, item.actorId))
        .map((item): AppNotification => {
          const actor = this.state.users.find((person) => person.id === item.actorId);
          const post = this.state.posts.find((entry) => entry.id === item.postId);
          const comment = this.state.comments.find((entry) => entry.id === item.commentId);
          const actorVisible = actor && actor.status !== 'deleted';
          return {
            id: item.id,
            type: item.type,
            actorId: actorVisible ? actor.id : null,
            actorUsername: actorVisible ? actor.username : null,
            actorDisplayName: actorVisible ? actor.displayName : null,
            actorAvatarPath: actorVisible ? actor.avatarPath : null,
            postId: item.postId,
            postType: post?.type ?? null,
            postTitle: post?.title ?? null,
            postExcerpt: post?.body ?? null,
            commentExcerpt: comment?.body ?? null,
            commentId: item.commentId,
            isRead: item.isRead,
            createdAt: item.createdAt,
          };
        });
    });
  }

  markNotificationRead(id: string) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const notification = this.state.notifications.find((item) => item.id === id && item.recipientId === user.id);
      if (!notification) throw new AppError('NOT_FOUND', 'not_found');
      notification.isRead = true;
      await this.persist();
    });
  }

  markAllNotificationsRead() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      for (const notification of this.state.notifications) if (notification.recipientId === user.id) notification.isRead = true;
      await this.persist();
    });
  }

  getNotificationPreferences() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      return this.state.preferences.find((item) => item.userId === user.id) ?? { replies: true, mentions: true };
    });
  }

  updateNotificationPreferences(preferences: { replies: boolean; mentions: boolean }) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const current = this.state.preferences.find((item) => item.userId === user.id);
      if (current) {
        current.replies = preferences.replies;
        current.mentions = preferences.mentions;
      } else this.state.preferences.push({ userId: user.id, ...preferences });
      await this.persist();
    });
  }

  report(input: { targetType: 'post' | 'comment'; targetId: string; reason: ReportItem['reason']; details?: string }) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const parsed = reportSchema.safeParse({ reason: input.reason, details: input.details ?? '' });
      if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message ?? 'INVALID_INPUT', 'validation');
      const authorId = input.targetType === 'post'
        ? this.state.posts.find((post) => post.id === input.targetId)?.authorId
        : this.state.comments.find((comment) => comment.id === input.targetId)?.authorId;
      if (!authorId && input.targetType === 'post' && !this.state.posts.some((post) => post.id === input.targetId)) throw new AppError('NOT_FOUND', 'not_found');
      if (input.targetType === 'comment' && !this.state.comments.some((comment) => comment.id === input.targetId)) throw new AppError('NOT_FOUND', 'not_found');
      if (authorId === user.id) throw new AppError('SELF_ACTION', 'validation');
      this.guardRate(user.id, 'report', LIMITS.reportsPerHour);
      this.state.reports.unshift({
        id: Crypto.randomUUID(),
        reporterId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details?.trim() || null,
        status: 'open',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolvedBy: null,
      });
      await this.persist();
    });
  }

  setBlocked(userId: string, blocked: boolean) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      if (userId === user.id) throw new AppError('SELF_ACTION', 'validation');
      if (!this.state.users.some((item) => item.id === userId)) throw new AppError('NOT_FOUND', 'not_found');
      this.state.blocks = this.state.blocks.filter((block) => !(block.blockerId === user.id && block.blockedId === userId));
      if (blocked) this.state.blocks.push({ blockerId: user.id, blockedId: userId, createdAt: new Date().toISOString() });
      await this.persist();
    });
  }

  listBlocked() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      return this.state.blocks
        .filter((block) => block.blockerId === user.id)
        .map((block) => this.profile(this.state.users.find((item) => item.id === block.blockedId), user.id))
        .filter((profile) => profile.status !== 'deleted');
    });
  }

  listSavedPosts() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const ids = this.state.saves.filter((save) => save.userId === user.id).map((save) => save.postId);
      return this.visiblePosts(user.id).filter((post) => ids.includes(post.id)).map((post) => this.postCard(post, user.id));
    });
  }

  listJoinedCommunities() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const ids = new Set(this.state.memberships.filter((membership) => membership.userId === user.id).map((membership) => membership.communityId));
      return this.state.communities.filter((community) => ids.has(community.id)).map((community) => this.community(community.id, user.id));
    });
  }

  listProfilePosts(username: string) {
    return this.enqueue(async () => {
      const user = this.state.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
      if (!user) throw new AppError('NOT_FOUND', 'not_found');
      return this.visiblePosts(this.state.sessionUserId)
        .filter((post) => post.authorId === user.id)
        .map((post) => this.postCard(post, this.state.sessionUserId));
    });
  }

  listProfileComments(username: string) {
    return this.enqueue(async () => {
      const user = this.state.users.find((item) => item.username.toLowerCase() === username.toLowerCase());
      if (!user) throw new AppError('NOT_FOUND', 'not_found');
      return this.state.comments
        .filter((comment) => comment.authorId === user.id && comment.status === 'published' && !this.blocked(this.state.sessionUserId, user.id))
        .map((comment) => this.commentCard(comment, this.state.sessionUserId));
    });
  }

  getCapabilities() {
    return this.enqueue(async () => this.capabilitiesFor(this.state.sessionUserId));
  }

  listReports() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const caps = this.capabilitiesFor(user.id);
      return this.state.reports
        .filter((report) => {
          const communityId = this.communityIdForTarget(report.targetType, report.targetId);
          return !!communityId && this.mayModerate(communityId, caps);
        })
        .map((report): ReportItem => {
          const communityId = this.communityIdForTarget(report.targetType, report.targetId)!;
          const community = this.state.communities.find((item) => item.id === communityId);
          const reporter = this.state.users.find((item) => item.id === report.reporterId);
          const excerpt = report.targetType === 'post'
            ? this.state.posts.find((post) => post.id === report.targetId)?.title ?? 'Post'
            : this.state.comments.find((comment) => comment.id === report.targetId)?.body.slice(0, 140) ?? 'Comment';
          return {
            id: report.id,
            reporterId: report.reporterId,
            reporterUsername: reporter?.username ?? null,
            targetType: report.targetType,
            targetId: report.targetId,
            communityId,
            communityName: community?.name ?? '',
            reason: report.reason,
            details: report.details,
            status: report.status,
            excerpt,
            createdAt: report.createdAt,
          };
        });
    });
  }

  private communityIdForTarget(targetType: 'post' | 'comment', targetId: string) {
    if (targetType === 'post') return this.state.posts.find((post) => post.id === targetId)?.communityId ?? null;
    const comment = this.state.comments.find((item) => item.id === targetId);
    return comment ? this.state.posts.find((post) => post.id === comment.postId)?.communityId ?? null : null;
  }

  listModerationHistory() {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const caps = this.capabilitiesFor(user.id);
      return this.state.moderationActions
        .filter((action) => this.mayModerate(action.communityId, caps))
        .map((action) => ({
          id: action.id,
          action: action.action,
          reason: action.reason,
          targetType: action.targetType,
          targetId: action.targetId,
          communityName: this.state.communities.find((community) => community.id === action.communityId)?.name ?? '',
          createdAt: action.createdAt,
        }));
    });
  }

  moderate(input: ModerationInput) {
    return this.enqueue(async () => {
      const user = this.requireUser();
      const caps = this.capabilitiesFor(user.id);
      if (!this.mayModerate(input.communityId, caps)) throw new AppError('FORBIDDEN', 'forbidden');
      if (input.reason.trim().length < 3) throw new AppError('Add a short reason.', 'validation');
      if (input.action === 'remove') {
        if (input.targetType === 'post') {
          const post = this.state.posts.find((item) => item.id === input.targetId && item.communityId === input.communityId);
          if (!post) throw new AppError('NOT_FOUND', 'not_found');
          post.status = 'removed';
          post.body = '';
        } else {
          const comment = this.state.comments.find((item) => item.id === input.targetId);
          const post = comment ? this.state.posts.find((item) => item.id === comment.postId) : undefined;
          if (!comment || post?.communityId !== input.communityId) throw new AppError('NOT_FOUND', 'not_found');
          comment.status = 'removed';
          comment.body = '';
        }
      }
      if (input.action === 'lock' || input.action === 'unlock') {
        const post = this.state.posts.find((item) => item.id === input.targetId && item.communityId === input.communityId);
        if (!post) throw new AppError('NOT_FOUND', 'not_found');
        post.isLocked = input.action === 'lock';
      }
      if (input.reportId) {
        const report = this.state.reports.find((item) => item.id === input.reportId);
        if (report) {
          report.status = input.action === 'dismiss' ? 'dismissed' : 'actioned';
          report.resolvedAt = new Date().toISOString();
          report.resolvedBy = user.id;
        }
      }
      this.state.moderationActions.unshift({
        id: Crypto.randomUUID(),
        moderatorId: user.id,
        communityId: input.communityId,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        reason: input.reason.trim(),
        createdAt: new Date().toISOString(),
      });
      await this.persist();
    });
  }
}

export function createDemoApi(): GatherApi {
  return new DemoStore();
}
