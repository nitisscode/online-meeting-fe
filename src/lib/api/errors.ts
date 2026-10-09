import { ERROR_MESSAGE_MAX_LENGTH } from "../../constants/security";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function cleanMessage(value: string): string {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, ERROR_MESSAGE_MAX_LENGTH);
}

function asMessages(value: unknown): string[] {
  if (typeof value === "string") {
    const cleaned = cleanMessage(value);
    return cleaned ? [cleaned] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => asMessages(item));
  }

  return [];
}

/** Turns a Django REST Framework error body into a short, display-safe message. */
export function parseApiError(status: number, body: unknown): ApiError {
  if (status >= 500) {
    return new ApiError("The meeting service could not complete that request.", status);
  }

  if (!body || typeof body !== "object") {
    return new ApiError("The meeting service rejected that request.", status);
  }

  const record = body as Record<string, unknown>;
  const detail = asMessages(record.detail);
  if (detail.length > 0) {
    return new ApiError(detail.join(" "), status);
  }

  const fieldErrors: Record<string, string[]> = {};
  const formMessages: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    const messages = asMessages(value);
    if (messages.length === 0) {
      continue;
    }

    if (key === "non_field_errors") {
      formMessages.push(...messages);
      continue;
    }

    fieldErrors[key] = messages;
  }

  const message =
    formMessages[0] ??
    (Object.keys(fieldErrors).length > 0
      ? "Check the highlighted fields."
      : "The meeting service rejected that request.");

  return new ApiError(message, status, fieldErrors);
}
