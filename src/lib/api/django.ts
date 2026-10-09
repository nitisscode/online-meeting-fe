import "server-only";

import { API_PATHS } from "@/constants/api";
import { DJANGO_TIMEOUT_MS } from "@/constants/security";
import { ApiError, parseApiError } from "@/lib/api/errors";
import { clearAuthCookies, readAccessToken, readRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

type TokenPair = {
  access: string;
  refresh?: string;
};

function djangoUrl(path: string): string {
  const base = env.djangoApiUrl.endsWith("/") ? env.djangoApiUrl : `${env.djangoApiUrl}/`;
  return new URL(path.replace(/^\//, ""), base).toString();
}

async function djangoRequest(path: string, init: RequestInit, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(djangoUrl(path), {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(DJANGO_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("The meeting service is unavailable. Check that Django is running.", 503);
  }
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new ApiError(
        "The Django API does not have that route. Start the backend from the online-meeting repo.",
        404,
      );
    }
    throw new ApiError("The meeting service returned an unexpected response.", response.ok ? 502 : response.status);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("The meeting service returned an unreadable response.", 502);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await readBody(response);
  if (!response.ok) {
    throw parseApiError(response.status, body);
  }
  return body as T;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = refreshTokensOnce().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function refreshTokensOnce(): Promise<boolean> {
  const refresh = await readRefreshToken();
  if (!refresh) {
    await clearAuthCookies();
    return false;
  }

  const response = await djangoRequest(API_PATHS.refresh, {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    await clearAuthCookies();
    return false;
  }

  const body = (await readBody(response)) as Partial<TokenPair> | null;
  if (!body?.access) {
    await clearAuthCookies();
    return false;
  }

  await setAuthCookies({
    access: body.access,
    refresh: body.refresh ?? refresh,
  });

  return true;
}

/** Calls Django without a session. Used for signup and login. */
export async function djangoPublic<T>(path: string, init: RequestInit): Promise<T> {
  const response = await djangoRequest(path, init);
  return parseResponse<T>(response);
}

/**
 * Calls Django with the access cookie. On 401, rotates the refresh token once
 * and retries. Tokens stay on the server.
 */
export async function djangoFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await readAccessToken();
  if (!token) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      throw new ApiError("Your session has ended. Sign in again.", 401);
    }
    token = await readAccessToken();
  }

  if (!token) {
    throw new ApiError("Your session has ended. Sign in again.", 401);
  }

  let response = await djangoRequest(path, init, token);
  if (response.status === 401) {
    const refreshed = await refreshTokens();
    const nextToken = refreshed ? await readAccessToken() : undefined;
    if (!nextToken) {
      throw new ApiError("Your session has ended. Sign in again.", 401);
    }
    response = await djangoRequest(path, init, nextToken);
  }

  return parseResponse<T>(response);
}

export async function loginWithPassword(identifier: string, password: string): Promise<void> {
  let response: Response;
  try {
    response = await djangoRequest(API_PATHS.login, {
      method: "POST",
      body: JSON.stringify({ email: identifier, password }),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("The meeting service is unavailable. Check that Django is running.", 503);
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    throw new ApiError("Email, username, or password is incorrect.", 401);
  }

  if (!response.ok) {
    throw parseApiError(response.status, await readBody(response));
  }

  const body = (await readBody(response)) as Partial<TokenPair> | null;
  if (!body?.access || !body.refresh) {
    throw new ApiError("The meeting service returned an unreadable response.", 502);
  }

  await setAuthCookies({ access: body.access, refresh: body.refresh });
}

export async function logoutSession(): Promise<void> {
  const refresh = await readRefreshToken();
  if (refresh) {
    await djangoRequest(API_PATHS.logout, {
      method: "POST",
      body: JSON.stringify({ refresh }),
    }).catch(() => undefined);
  }

  await clearAuthCookies();
}
