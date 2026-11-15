import { SUPPORT_GIFTS, giveLabel, monthlyProductIds, onceProductIds, supportGift } from '@/lib/support';

describe('support gifts', () => {
  it('keeps one-time gifts and the monthly gift separate', () => {
    expect(onceProductIds()).toEqual(['support_3', 'support_5', 'support_10']);
    expect(monthlyProductIds()).toEqual(['support_monthly']);
    expect(giveLabel(SUPPORT_GIFTS[1])).toBe('Give $5');
    expect(giveLabel(SUPPORT_GIFTS[3])).toBe('Give $3 each month');
    expect(giveLabel(SUPPORT_GIFTS[0], '$2.99')).toBe('Give $2.99');
    expect(supportGift('support_10')?.kind).toBe('once');
    expect(supportGift('missing')).toBeUndefined();
  });
});
