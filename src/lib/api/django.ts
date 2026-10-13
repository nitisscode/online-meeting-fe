import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { API_PATHS } from "@/constants/api";
import { OTP_PURPOSE } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { DJANGO_TIMEOUT_MS } from "@/constants/security";
import { ApiError, parseApiError } from "@/lib/api/errors";
import { clearAuthCookies, readAccessToken, readRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env";
import { safeInternalPath } from "@/lib/security/safe-path";

type TokenPair = {
  access: string;
  refresh?: string;
};

function djangoUrl(path: string): string {
  const base = env.djangoApiUrl.endsWith("/") ? env.djangoApiUrl : `${env.djangoApiUrl}/`;
  return new URL(path.replace(/^\//, ""), base).toString();
}

async function djangoRequest(path: string, init: RequestInit, token?: string): Promise<Response> {
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("Accept", "application/json");

  if (init.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(djangoUrl(path), {
      ...init,
      headers: requestHeaders,
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

/** Exchanges a refresh token. Does not write cookies. */
export async function rotateRefreshToken(refresh: string): Promise<{ access: string; refresh: string }> {
  const response = await djangoRequest(API_PATHS.refresh, {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw parseApiError(response.status, await readBody(response));
  }

  const body = (await readBody(response)) as Partial<TokenPair> | null;
  if (!body?.access) {
    throw new ApiError("The meeting service returned an unreadable response.", 502);
  }

  return { access: body.access, refresh: body.refresh ?? refresh };
}

async function refreshTokensOnce(): Promise<boolean> {
  const refresh = await readRefreshToken();
  if (!refresh) {
    await clearAuthCookies();
    return false;
  }

  try {
    await setAuthCookies(await rotateRefreshToken(refresh));
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      throw error;
    }
    await clearAuthCookies();
    return false;
  }
}

/**
 * Page renders cannot set cookies. Send the browser to the refresh route,
 * which is allowed to rotate or clear the session and then come back.
 */
async function renewAccessToken(): Promise<string> {
  const headerStore = await headers();
  if (headerStore.has("next-action")) {
    const refreshed = await refreshTokens();
    const token = refreshed ? await readAccessToken() : undefined;
    if (!token) {
      throw new ApiError("Your session has ended. Sign in again.", 401);
    }
    return token;
  }

  const next = safeInternalPath(headerStore.get("x-om-path"), ROUTES.dashboard);
  redirect(`${ROUTES.sessionRefresh}?next=${encodeURIComponent(next)}`);
}

/** Calls Django without a session. Used for signup and login. */
export async function djangoPublic<T>(path: string, init: RequestInit): Promise<T> {
  const response = await djangoRequest(path, init);
  return parseResponse<T>(response);
}

/**
 * Calls Django with the access cookie. A page render that needs a new access
 * token redirects to the session refresh route. A Server Action rotates it here.
 */
export async function djangoFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await readAccessToken();
  if (!token) {
    token = await renewAccessToken();
  }

  let response = await djangoRequest(path, init, token);
  if (response.status === 401) {
    token = await renewAccessToken();
    response = await djangoRequest(path, init, token);
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

/** Asks Django to email a login code. The code in the response is discarded. */
export async function requestLoginOtp(email: string): Promise<void> {
  const response = await djangoRequest(API_PATHS.otpRequest, {
    method: "POST",
    body: JSON.stringify({ email, purpose: OTP_PURPOSE.Login }),
  });

  if (!response.ok) {
    throw parseApiError(response.status, await readBody(response));
  }

  await response.arrayBuffer().catch(() => undefined);
}

/** Asks Django to email a password-reset code. The response body is discarded. */
export async function requestPasswordReset(email: string): Promise<void> {
  const response = await djangoRequest(API_PATHS.forgotPassword, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw parseApiError(response.status, await readBody(response));
  }

  await response.arrayBuffer().catch(() => undefined);
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}): Promise<void> {
  const response = await djangoRequest(API_PATHS.resetPassword, {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      purpose: OTP_PURPOSE.PasswordReset,
      otp: input.otp,
      new_password: input.new_password,
      confirm_password: input.confirm_password,
    }),
  });

  if (!response.ok) {
    throw parseApiError(response.status, await readBody(response));
  }

  await response.arrayBuffer().catch(() => undefined);
}

export async function loginWithOtp(email: string, otp: string): Promise<void> {
  const response = await djangoRequest(API_PATHS.otpVerify, {
    method: "POST",
    body: JSON.stringify({ email, purpose: OTP_PURPOSE.Login, otp }),
  });

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
