/**
 * Cookie names for the Django JWT pair.
 * `src/proxy.ts` duplicates these strings because the proxy bundle
 * should not depend on application modules.
 */
export const COOKIE = {
  access: "om_access",
  refresh: "om_refresh",
} as const;

/**
 * Lifetimes must stay aligned with Django `SIMPLE_JWT` defaults:
 * access 60 minutes, refresh 7 days, rotation + blacklist enabled.
 */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Matches Django `MinimumLengthValidator` and the User field lengths. */
export const AUTH_LIMITS = {
  usernameMax: 150,
  nameMax: 150,
  emailMax: 254,
  passwordMin: 8,
  passwordMax: 128,
} as const;
