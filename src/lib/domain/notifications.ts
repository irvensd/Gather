import type { NotificationType, PostType } from '@/types';

export interface NotificationIntent {
  recipientId: string;
  type: NotificationType;
}

export function extractMentions(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(/(^|[^A-Za-z0-9_])@([A-Za-z][A-Za-z0-9_]{2,19})\b/g)) {
    const username = match[2];
    if (username) found.add(username.toLowerCase());
  }
  return [...found];
}

export function commentNotificationIntents(input: {
  actorId: string;
  postAuthorId: string | null;
  parentAuthorId: string | null;
  mentionedUserIds: readonly string[];
}): NotificationIntent[] {
  const intents: NotificationIntent[] = [];
  if (input.parentAuthorId) intents.push({ recipientId: input.parentAuthorId, type: 'comment_reply' });
  else if (input.postAuthorId) intents.push({ recipientId: input.postAuthorId, type: 'post_reply' });
  for (const recipientId of input.mentionedUserIds) intents.push({ recipientId, type: 'mention' });
  const seen = new Set<string>();
  return intents.filter((intent) => {
    if (intent.recipientId === input.actorId) return false;
    const key = `${intent.recipientId}:${intent.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatNotification(input: {
  type: NotificationType;
  actorUsername: string | null;
  postType: PostType | null;
}): string {
  const actor = input.actorUsername ? `@${input.actorUsername}` : 'Someone';
  if (input.type === 'comment_reply') return `${actor} replied to your comment.`;
  if (input.type === 'mention') return `${actor} mentioned you.`;
  if (input.postType === 'question') return `${actor} replied to your question.`;
  if (input.postType === 'prayer_request') return `${actor} replied to your prayer request.`;
  if (input.postType === 'testimony') return `${actor} replied to your testimony.`;
  return `${actor} replied to your post.`;
}

export function notificationContext(input: {
  postTitle?: string | null;
  postExcerpt?: string | null;
  commentExcerpt?: string | null;
}): { title: string | null; excerpt: string | null } {
  const title = input.postTitle?.trim() || null;
  const excerpt = (input.commentExcerpt || input.postExcerpt || '').replace(/\s+/g, ' ').trim();
  return { title, excerpt: excerpt.length > 0 ? excerpt : null };
}

export function allowsNotification(type: NotificationType, preferences: { replies: boolean; mentions: boolean }): boolean {
  if (type === 'mention') return preferences.mentions;
  return preferences.replies;
}
