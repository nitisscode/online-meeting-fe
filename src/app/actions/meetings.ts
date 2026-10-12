"use server";

import { redirect } from "next/navigation";

import { RATE_LIMIT } from "@/constants/security";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/errors";
import { type ActionState, readChecked, readString, validationState } from "@/lib/forms";
import { assertRateLimit, rateLimitKey, RateLimitError } from "@/lib/http/rate-limit";
import { createMeeting, deleteMeetingById, getCurrentUser, getMeeting, updateMeetingSettings } from "@/lib/meetings/api";
import { createMeetingSchema, meetingSettingsSchema, toCreateMeetingInput, type MeetingSettingsInput } from "@/lib/validation/meeting";

export async function createMeetingAction(
  _state: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createMeetingSchema.safeParse({
    title: readString(formData, "title"),
    description: readString(formData, "description"),
    timing: readString(formData, "timing"),
    scheduled_at: readString(formData, "scheduled_at"),
    is_private: readChecked(formData, "is_private"),
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
