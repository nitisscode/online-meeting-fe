/**
 * Django URL paths, relative to `DJANGO_API_URL`.
 * Trailing slashes match the Django URL config.
 */
export const API_PATHS = {
  signup: "users/signup/",
  login: "users/login/",
  refresh: "users/token/refresh/",
  logout: "users/token/blacklist/",
  me: "users/me/",
  meetings: "meetings/",
  meeting: (id: string) => `meetings/${id}/`,
} as const;
