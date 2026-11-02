import type { ReportReason } from '@/types';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_or_threats', label: 'Hate or threats' },
  { value: 'spam_or_scam', label: 'Spam or scam' },
  { value: 'personal_information', label: 'Personal information' },
  { value: 'other', label: 'Other' },
];

export function reportReasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((item) => item.value === reason)?.label ?? 'Other';
}
