/**
 * Django URL paths, relative to `DJANGO_API_URL`.
 * Trailing slashes match the Django URL config.
 */
export const API_PATHS = {
  signup: "users/signup/",
  login: "users/login/",
  otpRequest: "users/otp/request/",
  otpVerify: "users/otp/verify/",
  forgotPassword: "users/forgot-password/",
  resetPassword: "users/reset-password/",
  refresh: "users/token/refresh/",
  logout: "users/token/blacklist/",
  me: "users/me/",
  meetings: "meetings/",
  meeting: (id: string) => `meetings/${id}/`,
  meetingStart: (id: string) => `meetings/${id}/start/`,
  meetingEnd: (id: string) => `meetings/${id}/end/`,
  joinMeeting: "meetings/join/",
  meetingRoom: (id: string) => `meetings/${id}/participants/`,
} as const;
