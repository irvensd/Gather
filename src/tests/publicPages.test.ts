import { COMMUNITY_GUIDELINES_URL, PRIVACY_POLICY_URL } from '@/constants/publicPages';

describe('public pages', () => {
  it('gives the stores two different public pages', () => {
    expect(PRIVACY_POLICY_URL).toMatch(/^https:\/\/.+/);
    expect(COMMUNITY_GUIDELINES_URL).toMatch(/^https:\/\/.+/);
    expect(PRIVACY_POLICY_URL).not.toBe(COMMUNITY_GUIDELINES_URL);
  });
});
