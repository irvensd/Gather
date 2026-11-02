import type { AppNotification, NotificationType, PostType } from '@/types';

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

export const PRAYER_MILESTONES = [1, 5, 10, 25, 50, 100] as const;
export const VOTE_MILESTONES = [5, 10, 25, 50, 100] as const;

/** The highest milestone passed when a count moves from `before` to `after`, or null if none was crossed. */
export function crossedMilestone(before: number, after: number, steps: readonly number[]): number | null {
  let reached: number | null = null;
  for (const step of steps) if (before < step && after >= step) reached = step;
  return reached;
}

function postNoun(postType: PostType | null): string {
  if (postType === 'question') return 'question';
  if (postType === 'prayer_request') return 'prayer request';
  if (postType === 'testimony') return 'testimony';
  return 'post';
}

export function formatNotification(input: {
  type: NotificationType;
  actorUsername: string | null;
  postType: PostType | null;
  count?: number | null;
  communityName?: string | null;
  otherActors?: number;
  aboutComment?: boolean;
}): string {
  const others = input.otherActors ?? 0;
  const first = input.actorUsername ? `@${input.actorUsername}` : 'Someone';
  const actor = others === 0 ? first : others === 1 ? `${first} and 1 other` : `${first} and ${others} others`;
  const noun = postNoun(input.postType);
  const count = input.count ?? 0;
  if (input.type === 'comment_reply') return `${actor} replied to your comment.`;
  if (input.type === 'mention') return `${actor} mentioned you.`;
  if (input.type === 'prayer_milestone') {
    return count <= 1 ? 'Someone prayed for your prayer request.' : `${count} people prayed for your prayer request.`;
  }
  if (input.type === 'vote_milestone') return `Your ${noun} reached ${count} thumbs up.`;
  if (input.type === 'content_removed') return input.aboutComment ? 'A moderator removed your comment.' : `A moderator removed your ${noun}.`;
  if (input.type === 'new_report') return input.communityName ? `New report in ${input.communityName}.` : 'New report to review.';
  return `${actor} replied to your ${noun}.`;
}

export function allowsNotification(
  type: NotificationType,
  preferences: { replies: boolean; mentions: boolean; encouragement?: boolean },
): boolean {
  if (type === 'mention') return preferences.mentions;
  if (type === 'prayer_milestone' || type === 'vote_milestone') return preferences.encouragement ?? true;
  if (type === 'content_removed' || type === 'new_report') return true;
  return preferences.replies;
}

export interface NotificationGroup {
  key: string;
  ids: string[];
  lead: AppNotification;
  /** Everyone else who did the same thing, newest first, without repeats. */
  otherActors: number;
  isRead: boolean;
}

export interface NotificationSection {
  title: string;
  data: NotificationGroup[];
}

const DAY = 24 * 60 * 60 * 1000;

function sectionTitle(createdAt: string, now: Date): string {
  const created = new Date(createdAt);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (created.getTime() >= startOfToday) return 'Today';
  if (created.getTime() >= startOfToday - 6 * DAY) return 'This week';
  return 'Earlier';
}

/**
 * Splits newest-first notifications into Today / This week / Earlier, and folds replies to the same post
 * within a section into one row ("@mira and 2 others replied").
 */
export function groupNotifications(items: readonly AppNotification[], now: Date): NotificationSection[] {
  const sections: NotificationSection[] = [];
  const open = new Map<string, NotificationGroup & { actors: Set<string> }>();
  for (const item of items) {
    const title = sectionTitle(item.createdAt, now);
    let section = sections.find((entry) => entry.title === title);
    if (!section) {
      section = { title, data: [] };
      sections.push(section);
    }
    const foldKey = item.type === 'post_reply' && item.postId ? `${title}:${item.postId}` : null;
    const existing = foldKey ? open.get(foldKey) : undefined;
    if (existing) {
      existing.ids.push(item.id);
      existing.isRead = existing.isRead && item.isRead;
      const actor = item.actorId ?? `unknown:${item.id}`;
      if (!existing.actors.has(actor)) {
        existing.actors.add(actor);
        existing.otherActors += 1;
      }
      continue;
    }
    const group = { key: item.id, ids: [item.id], lead: item, otherActors: 0, isRead: item.isRead, actors: new Set([item.actorId ?? `unknown:${item.id}`]) };
    if (foldKey) open.set(foldKey, group);
    section.data.push(group);
  }
  return sections.map((section) => ({
    title: section.title,
    data: section.data.map((group) => ({ key: group.key, ids: group.ids, lead: group.lead, otherActors: group.otherActors, isRead: group.isRead })),
  }));
}
