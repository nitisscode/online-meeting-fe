/** App routes. Keep these in sync with `src/app` and `src/proxy.ts`. */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  sessionRefresh: "/api/session/refresh",
  dashboard: "/dashboard",
  newMeeting: "/meetings/new",
  joinMeeting: "/join",
  meeting: (id: string) => `/meetings/${id}`,
  room: (id: string) => `/room/${id}`,
} as const;

export const PROTECTED_PREFIXES = ["/dashboard", "/meetings", "/join", "/room"] as const;
