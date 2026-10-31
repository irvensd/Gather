import { LIMITS, RESERVED_USERNAMES } from '@/constants/limits';

const USERNAME = /^[A-Za-z][A-Za-z0-9_]*$/;

export function validateUsername(value: string): string | null {
  const username = value.trim();
  if (username.length < LIMITS.usernameMin || username.length > LIMITS.usernameMax || !USERNAME.test(username)) {
    return `Use ${LIMITS.usernameMin}–${LIMITS.usernameMax} characters: letters, numbers, and underscores. Start with a letter.`;
  }
  if (RESERVED_USERNAMES.includes(username.toLowerCase() as (typeof RESERVED_USERNAMES)[number])) {
    return 'That username is reserved.';
  }
  return null;
}

export function normalizeUsername(value: string): string {
  return value.trim();
}
