export const SUPPORT_GIFTS = [
  { id: 'support_3', kind: 'once', fallbackPrice: '$3', cadence: 'Once' },
  { id: 'support_5', kind: 'once', fallbackPrice: '$5', cadence: 'Once' },
  { id: 'support_10', kind: 'once', fallbackPrice: '$10', cadence: 'Once' },
  { id: 'support_monthly', kind: 'month', fallbackPrice: '$3', cadence: 'Each month' },
] as const;

export type SupportGift = (typeof SUPPORT_GIFTS)[number];
export type SupportGiftId = SupportGift['id'];

export const DEFAULT_SUPPORT_GIFT: SupportGiftId = 'support_5';

export function supportGift(id: string): SupportGift | undefined {
  return SUPPORT_GIFTS.find((gift) => gift.id === id);
}

export function onceProductIds(): string[] {
  return SUPPORT_GIFTS.filter((gift) => gift.kind === 'once').map((gift) => gift.id);
}

export function monthlyProductIds(): string[] {
  return SUPPORT_GIFTS.filter((gift) => gift.kind === 'month').map((gift) => gift.id);
}

export function giveLabel(gift: SupportGift, price?: string): string {
  const amount = price ?? gift.fallbackPrice;
  return gift.kind === 'month' ? `Give ${amount} each month` : `Give ${amount}`;
}
