/** Best-effort in-process limits. They reset on restart and are per server instance. */
export const RATE_LIMIT = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  signup: { limit: 5, windowMs: 15 * 60 * 1000 },
  meetingWrite: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const;

export const DJANGO_TIMEOUT_MS = 15_000;

export const ERROR_MESSAGE_MAX_LENGTH = 300;
