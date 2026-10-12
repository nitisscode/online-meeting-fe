import "server-only";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { API_PATHS } from "@/constants/api";
import { MEETING_LIMITS } from "@/constants/meetings";
import { ROUTES } from "@/constants/routes";
import { djangoFetch } from "@/lib/api/django";
import { ApiError } from "@/lib/api/errors";

const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

export type User = z.infer<typeof userSchema>;

const meetingSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: z.number().int(),
  scheduled_at: z.string().nullable(),
  started_at: z.string().nullable(),
  ended_at: z.string().nullable(),
  meeting_code: z.string().max(MEETING_LIMITS.meetingCodeLength),
});

export type MeetingSummary = z.infer<typeof meetingSummarySchema>;

const meetingSettingsSchema = z.object({
  id: z.uuid(),
  meeting: z.uuid(),
  allow_chat: z.boolean(),
  allow_screen_share: z.boolean(),
  allow_recording: z.boolean(),
  waiting_room_enabled: z.boolean(),
  allow_raise_hand: z.boolean(),
});

export type MeetingSettings = z.infer<typeof meetingSettingsSchema>;

const meetingDetailSchema = meetingSummarySchema.extend({
  description: z.string().nullable(),
  is_private: z.boolean(),
  pass_code: z.string().nullable(),
  created_by: z.uuid(),
  settings: meetingSettingsSchema.nullable().optional(),
});

export type MeetingDetail = z.infer<typeof meetingDetailSchema>;

export type CreateMeetingInput = {
  title: string;
  description?: string;
  scheduled_at: string | null;
  is_private: boolean;
  pass_code: string | null;
  settings: {
    allow_chat: boolean;
    allow_screen_share: boolean;
    allow_recording: boolean;
    waiting_room_enabled: boolean;
    allow_raise_hand: boolean;
  };
};

function parseData<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError("The meeting service returned an unexpected response.", 502);
  }
  return parsed.data;
}

export async function getCurrentUser(): Promise<User> {
  try {
    const data = await djangoFetch<unknown>(API_PATHS.me);
    return parseData(userSchema, data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect(ROUTES.login);
    }
    throw error;
  }
}

export async function listMeetings(): Promise<MeetingSummary[]> {
  let data: unknown;
  try {
    data = await djangoFetch<unknown>(API_PATHS.meetings);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect(ROUTES.login);
    }
    throw error;
  }

  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "results" in data && Array.isArray(data.results)
      ? data.results
      : null;

  if (!list) {
    throw new ApiError("The meeting service returned an unexpected response.", 502);
  }

  return list.map((item) => parseData(meetingSummarySchema, item));
}

export async function getMeeting(id: string): Promise<MeetingDetail> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    notFound();
  }

  try {
    const data = await djangoFetch<unknown>(API_PATHS.meeting(parsedId.data));
    return parseData(meetingDetailSchema, data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      redirect(ROUTES.login);
    }
    throw error;
  }
}

export async function createMeeting(input: CreateMeetingInput): Promise<MeetingDetail> {
  const data = await djangoFetch<unknown>(API_PATHS.meetings, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseData(meetingDetailSchema, data);
}

export async function updateMeetingSettings(
  id: string,
  settings: CreateMeetingInput["settings"],
): Promise<MeetingDetail> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }

  const data = await djangoFetch<unknown>(API_PATHS.meeting(parsedId.data), {
    method: "PATCH",
    body: JSON.stringify({ settings }),
  });
  return parseData(meetingDetailSchema, data);
}

const roomParticipantSchema = z.object({
  id: z.uuid(),
  user: userSchema,
  role: z.number().int(),
  connection_status: z.number().int().nullable(),
  joined_at: z.string().nullable(),
  left_at: z.string().nullable(),
});

const meetingRoomSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  meeting_code: z.string(),
  status: z.number().int(),
  settings: meetingSettingsSchema,
  participants: z.array(roomParticipantSchema),
});

export type MeetingRoom = z.infer<typeof meetingRoomSchema>;

export async function joinMeeting(input: { meeting_code: string; pass_code: string | null }): Promise<MeetingRoom> {
  const data = await djangoFetch<unknown>(API_PATHS.joinMeeting, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseData(meetingRoomSchema, data);
}

export async function getMeetingRoom(id: string): Promise<MeetingRoom> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    notFound();
  }

  try {
    const data = await djangoFetch<unknown>(API_PATHS.meetingRoom(parsedId.data));
    return parseData(meetingRoomSchema, data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect(ROUTES.login);
    }
    throw error;
  }
}

export async function startMeeting(id: string): Promise<void> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }
  await djangoFetch<unknown>(API_PATHS.meetingStart(parsedId.data), { method: "POST" });
}

export async function endMeeting(id: string): Promise<void> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }
  await djangoFetch<unknown>(API_PATHS.meetingEnd(parsedId.data), { method: "POST" });
}

export async function deleteMeetingById(id: string): Promise<void> {
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }

  await djangoFetch<unknown>(API_PATHS.meeting(parsedId.data), { method: "DELETE" });
}
