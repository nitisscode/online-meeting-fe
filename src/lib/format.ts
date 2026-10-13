export function displayName(user: { first_name: string; last_name: string; email: string }): string {
  const name = `${user.first_name} ${user.last_name}`.trim();
  return name || user.email;
}

/** Wall-clock zone for meeting times. Django `TIME_ZONE` uses the same value. */
export const APP_TIME_ZONE = "Asia/Kolkata";

const wallTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function wallParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);

  const value: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      value[part.type] = Number(part.value);
    }
  }

  if ([value.year, value.month, value.day, value.hour, value.minute].some((item) => Number.isNaN(item))) {
    return null;
  }

  return {
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour === 24 ? 0 : value.hour,
    minute: value.minute,
  };
}

function zoneOffsetMs(utcMs: number): number {
  const wall = wallParts(new Date(utcMs));
  if (!wall) {
    return 0;
  }
  return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute) - utcMs;
}

/** Reads a `datetime-local` value as Asia/Kolkata, not the machine timezone. */
export function parseAppDateTime(value: string): Date | null {
  const match = wallTimePattern.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = utcGuess - zoneOffsetMs(utcGuess);
  const correctedOffset = zoneOffsetMs(utcMs);
  if (correctedOffset !== zoneOffsetMs(utcGuess)) {
    utcMs = utcGuess - correctedOffset;
  }

  const date = new Date(utcMs);
  const wall = wallParts(date);
  if (!wall || wall.year !== year || wall.month !== month || wall.day !== day || wall.hour !== hour || wall.minute !== minute) {
    return null;
  }

  return date;
}

export function formatElapsed(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatRelativeTime(value: string, now = Date.now()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "now";
  }

  const minutes = Math.floor(Math.max(0, now - date.getTime()) / 60000);
  if (minutes < 1) {
    return "now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}
