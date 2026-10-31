export type AppErrorCode =
  | 'auth'
  | 'validation'
  | 'rate_limit'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'locked'
  | 'suspended'
  | 'network';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(message: string, code: AppErrorCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

const MESSAGE_BY_TOKEN: Record<string, { message: string; code: AppErrorCode }> = {
  AUTH_REQUIRED: { message: 'Sign in to continue.', code: 'auth' },
  INVALID_INPUT: { message: 'Check the form and try again.', code: 'validation' },
  USERNAME_TAKEN: { message: 'That username is taken.', code: 'conflict' },
  COMMUNITY_TAKEN: { message: 'A community with that name already exists.', code: 'conflict' },
  USERNAME_INVALID: { message: 'Choose a different username.', code: 'validation' },
  RATE_LIMIT: { message: 'You are doing that too quickly. Try again in a little while.', code: 'rate_limit' },
  NOT_FOUND: { message: 'That content is no longer available.', code: 'not_found' },
  FORBIDDEN: { message: 'You do not have permission to do that.', code: 'forbidden' },
  LOCKED: { message: 'This discussion is locked.', code: 'locked' },
  SUSPENDED: { message: 'This account cannot post right now.', code: 'suspended' },
  SELF_ACTION: { message: 'You cannot do that to your own account.', code: 'validation' },
  MAX_DEPTH: { message: 'This thread is as deep as replies can go.', code: 'validation' },
};

export function mapServerError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : String(error);
  for (const [token, mapped] of Object.entries(MESSAGE_BY_TOKEN)) {
    if (message.includes(token)) return new AppError(mapped.message, mapped.code);
  }
  if (/network|fetch|offline/i.test(message)) {
    return new AppError('You appear to be offline. Try again when you are connected.', 'network');
  }
  return new AppError(message || 'Something went wrong. Try again.', 'network');
}
