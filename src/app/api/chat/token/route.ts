import { NextResponse } from "next/server";

import { rotateRefreshToken } from "@/lib/api/django";
import { ApiError } from "@/lib/api/errors";
import { readAccessToken, readRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

function socketBase(): string {
  const url = new URL(env.djangoApiUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}

export async function GET(request: Request) {
  const refreshRequested = new URL(request.url).searchParams.get("refresh") === "1";
  let token = refreshRequested ? undefined : await readAccessToken();

  if (!token) {
    const refresh = await readRefreshToken();
    if (!refresh) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    try {
      const tokens = await rotateRefreshToken(refresh);
      await setAuthCookies(tokens);
      token = tokens.access;
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        return NextResponse.json({ detail: error.message }, { status: 503 });
      }
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json(
    { token, socketBase: socketBase() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
