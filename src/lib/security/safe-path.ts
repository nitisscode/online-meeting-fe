/**
 * Accept only same-origin relative paths.
 * Rejects protocol-relative URLs and backslashes so a `next` query cannot
 * send the browser to another site after login.
 */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  if (value.length === 0 || value.length > 200) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  if (value.includes("://") || value.includes("\\") || value.includes("\0")) {
    return fallback;
  }

  return value;
}
