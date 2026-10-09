import "server-only";

import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/constants/auth";

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export async function readAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE.access)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE.refresh)?.value;
}

export async function setAuthCookies(tokens: { access: string; refresh: string }) {
  const store = await cookies();

  store.set(COOKIE.access, tokens.access, {
    ...baseCookie,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  store.set(COOKIE.refresh, tokens.refresh, {
    ...baseCookie,
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(COOKIE.access);
  store.delete(COOKIE.refresh);
}
