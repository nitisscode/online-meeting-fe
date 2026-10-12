import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { rotateRefreshToken } from "@/lib/api/django";
import { ApiError } from "@/lib/api/errors";
import { clearAuthCookies, readRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { safeInternalPath } from "@/lib/security/safe-path";

function returnPath(value: string | null): string {
  const path = safeInternalPath(value, ROUTES.dashboard);
  if (path.startsWith("/api")) {
    return ROUTES.dashboard;
  }
  return path;
}

export async function GET(request: Request) {
  const next = returnPath(new URL(request.url).searchParams.get("next"));
  const refresh = await readRefreshToken();

  if (!refresh) {
    await clearAuthCookies();
    redirect(`${ROUTES.login}?next=${encodeURIComponent(next)}`);
  }

  try {
    await setAuthCookies(await rotateRefreshToken(refresh));
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      throw error;
    }
    await clearAuthCookies();
    redirect(`${ROUTES.login}?next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
