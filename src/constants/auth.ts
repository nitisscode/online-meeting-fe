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

/**
 * Integer values from Django `OTPPurpose` in `apps/users/models.py`.
 * Sign-in sends `Login`. Verify only issues tokens for that purpose.
 */
export const OTP_PURPOSE = {
  Login: 0,
  EmailVerification: 1,
  PasswordReset: 2,
} as const;

export type OtpPurpose = (typeof OTP_PURPOSE)[keyof typeof OTP_PURPOSE];

/** Matches Django OTP settings: 4 digits, 120s expiry, 60s resend cooldown. */
export const OTP_LIMITS = {
  length: 4,
  expirySeconds: 120,
  resendCooldownSeconds: 60,
} as const;
