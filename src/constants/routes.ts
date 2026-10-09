/** App routes. Keep these in sync with `src/app` and `src/proxy.ts`. */
export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  newMeeting: "/meetings/new",
  meeting: (id: string) => `/meetings/${id}`,
} as const;

export const PROTECTED_PREFIXES = ["/dashboard", "/meetings"] as const;
