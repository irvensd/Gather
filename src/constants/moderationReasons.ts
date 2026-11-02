export type ModerationAction = 'remove' | 'lock' | 'unlock' | 'dismiss';

export const MODERATION_REASONS: Record<ModerationAction, readonly string[]> = {
  remove: ['Breaks community rules', 'Harassment or insults', 'Spam or advertising', 'Shares personal information', 'Off topic'],
  lock: ['Discussion is getting heated', 'Question has been answered', 'Off topic', 'Breaks community rules'],
  unlock: ['Discussion has calmed down', 'Locked by mistake'],
  dismiss: ['Does not break the rules', 'Already handled', 'Duplicate report'],
};

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  remove: 'Removed',
  lock: 'Locked',
  unlock: 'Unlocked',
  dismiss: 'Dismissed report',
};

export function composeModerationReason(preset: string, note: string): string {
  const extra = note.trim().replace(/\s+/g, ' ');
  return (extra ? `${preset}: ${extra}` : preset).slice(0, 500);
}
