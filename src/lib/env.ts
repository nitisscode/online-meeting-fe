import "server-only";

/**
 * Server-only Django origin. Never read this from a Client Component
 * and never prefix the variable with NEXT_PUBLIC_.
 */
function readDjangoApiUrl(): string {
  const configured = process.env.DJANGO_API_URL?.trim();
  const value =
    configured && configured.length > 0
      ? configured
      : process.env.NODE_ENV === "production"
        ? ""
        : "http://127.0.0.1:8000";

  if (!value) {
    throw new Error("DJANGO_API_URL is required in production.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DJANGO_API_URL must be an absolute http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("DJANGO_API_URL must use http or https.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("DJANGO_API_URL must not include credentials, query, or hash.");
  }

  const path = url.pathname.replace(/\/$/, "");
  return `${url.origin}${path}`;
}

let djangoApiUrl: string | undefined;

export const env = {
  /** Read on each server call so `next build` can load modules without the variable. */
  get djangoApiUrl(): string {
    djangoApiUrl ??= readDjangoApiUrl();
    return djangoApiUrl;
  },
};
