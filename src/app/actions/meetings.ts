"use server";

import { redirect } from "next/navigation";

import { RATE_LIMIT } from "@/constants/security";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/errors";
import { type ActionState, readChecked, readString, validationState } from "@/lib/forms";
import { assertRateLimit, rateLimitKey, RateLimitError } from "@/lib/http/rate-limit";
import { createMeeting, deleteMeetingById, endMeeting, getCurrentUser, getMeeting, getMeetingRoom, joinMeeting, startMeeting, updateMeetingSettings } from "@/lib/meetings/api";
import { createMeetingSchema, joinMeetingSchema, meetingSettingsSchema, toCreateMeetingInput, type MeetingSettingsInput } from "@/lib/validation/meeting";

export async function createMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createMeetingSchema.safeParse({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    timing: readString(formData, "timing"),
    scheduled_at: readString(formData, "scheduled_at"),
    pass_code: readString(formData, "pass_code"),
    allow_chat: readChecked(formData, "allow_chat"),
    allow_screen_share: readChecked(formData, "allow_screen_share"),
    allow_recording: readChecked(formData, "allow_recording"),
    waiting_room_enabled: readChecked(formData, "waiting_room_enabled"),
    allow_raise_hand: readChecked(formData, "allow_raise_hand"),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  let meetingId: string;
  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    const meeting = await createMeeting(toCreateMeetingInput(parsed.data));
    meetingId = meeting.id;
    if (parsed.data.timing === "now") {
      try {
        await startMeeting(meeting.id);
      } catch (error) {
        if (error instanceof ApiError) {
          return { message: `${error.message} The meeting was saved.` };
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { message: error.message };
    }
    if (error instanceof ApiError) {
      return { message: error.message, fieldErrors: error.fieldErrors };
    }
    throw error;
  }

  redirect(ROUTES.meeting(meetingId));
}

export async function startMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const meetingId = readString(formData, "meetingId");
  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    await startMeeting(meetingId);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  redirect(ROUTES.meeting(meetingId));
}

export async function endMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const meetingId = readString(formData, "meetingId");
  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    await endMeeting(meetingId);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  redirect(ROUTES.meeting(meetingId));
}

export async function enterMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const meetingId = readString(formData, "meetingId");
  let roomId: string;
  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    const meeting = await getMeeting(meetingId);
    const room = await joinMeeting({
      meeting_code: meeting.meeting_code,
      pass_code: meeting.pass_code,
    });
    roomId = room.id;
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  redirect(ROUTES.room(roomId));
}

export async function joinMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinMeetingSchema.safeParse({
    meeting_code: readString(formData, "meeting_code").trim().toUpperCase(),
    pass_code: readString(formData, "pass_code").trim(),
  });

  if (!parsed.success) {
    return validationState(parsed.error);
  }

  let roomId: string;
  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    const room = await joinMeeting({
      meeting_code: parsed.data.meeting_code,
      pass_code: parsed.data.pass_code.length > 0 ? parsed.data.pass_code : null,
    });
    roomId = room.id;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { message: error.message };
    }
    if (error instanceof ApiError) {
      return { message: error.message, fieldErrors: error.fieldErrors };
    }
    throw error;
  }

  redirect(ROUTES.room(roomId));
}

export async function loadMeetingRoom(meetingId: string) {
  try {
    return { room: await getMeetingRoom(meetingId) };
  } catch (error) {
    if (error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }
}

export async function updateMeetingSettingsAction(
  meetingId: string,
  settings: MeetingSettingsInput,
): Promise<ActionState> {
  const parsed = meetingSettingsSchema.safeParse(settings);
  if (!parsed.success) {
    return validationState(parsed.error);
  }

  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    const [user, meeting] = await Promise.all([getCurrentUser(), getMeeting(meetingId)]);
    if (user.id !== meeting.created_by) {
      return { message: "Only the host can change these settings." };
    }
    await updateMeetingSettings(meetingId, parsed.data);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  return {};
}

export async function deleteMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  if (readString(formData, "confirm") !== "yes") {
    return { message: "Confirm that you want to delete this meeting." };
  }

  try {
    await assertRateLimit(
      await rateLimitKey("meeting-write"),
      RATE_LIMIT.meetingWrite.limit,
      RATE_LIMIT.meetingWrite.windowMs,
    );
    await deleteMeetingById(readString(formData, "meetingId"));
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  redirect(ROUTES.dashboard);
}
