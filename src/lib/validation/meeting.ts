import "server-only";

import { z } from "zod";

import { MEETING_LIMITS } from "@/constants/meetings";
import { parseAppDateTime } from "@/lib/format";

export const createMeetingSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Give the meeting a title." })
      .max(MEETING_LIMITS.titleMax, { error: `Use at most ${MEETING_LIMITS.titleMax} characters.` }),
    description: z
      .string()
      .trim()
      .max(MEETING_LIMITS.descriptionMax, {
        error: `Use at most ${MEETING_LIMITS.descriptionMax} characters.`,
      }),
    timing: z.enum(["now", "schedule"], { error: "Choose when the meeting starts." }),
    scheduled_at: z.string().trim(),
    pass_code: z
      .string()
      .trim()
      .max(MEETING_LIMITS.passCodeMax, { error: `Use at most ${MEETING_LIMITS.passCodeMax} characters.` })
      .regex(/^[A-Za-z0-9]*$/, { error: "Use letters and numbers only." }),
    allow_chat: z.boolean(),
    allow_screen_share: z.boolean(),
    allow_recording: z.boolean(),
    waiting_room_enabled: z.boolean(),
    allow_raise_hand: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.timing === "schedule") {
      const time = parseAppDateTime(value.scheduled_at);
      if (!time) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduled_at"],
          message: "Choose a date and time.",
        });
      } else if (time.getTime() < Date.now() - 60_000) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduled_at"],
          message: "Choose a time in the future.",
        });
      }
    }
  });

export type CreateMeetingForm = z.infer<typeof createMeetingSchema>;

export const meetingSettingsSchema = z.object({
  allow_chat: z.boolean(),
  allow_screen_share: z.boolean(),
  allow_recording: z.boolean(),
  waiting_room_enabled: z.boolean(),
  allow_raise_hand: z.boolean(),
});

export type MeetingSettingsInput = z.infer<typeof meetingSettingsSchema>;

export const joinMeetingSchema = z.object({
  meeting_code: z
    .string()
    .trim()
    .min(1, { error: "Enter the meeting code." })
    .max(MEETING_LIMITS.meetingCodeLength, { error: `Use at most ${MEETING_LIMITS.meetingCodeLength} characters.` })
    .regex(/^[A-Z0-9]+$/, { error: "Use letters and numbers only." }),
  pass_code: z
    .string()
    .trim()
    .max(MEETING_LIMITS.passCodeMax, { error: `Use at most ${MEETING_LIMITS.passCodeMax} characters.` })
    .regex(/^[A-Za-z0-9]*$/, { error: "Use letters and numbers only." }),
});

export function toCreateMeetingInput(value: CreateMeetingForm) {
  const passCode = value.pass_code.length > 0 ? value.pass_code : null;
  return {
    title: value.title,
    description: value.description,
    scheduled_at: value.timing === "schedule" ? parseAppDateTime(value.scheduled_at)?.toISOString() ?? null : null,
    is_private: passCode !== null,
    pass_code: passCode,
    settings: {
      allow_chat: value.allow_chat,
      allow_screen_share: value.allow_screen_share,
      allow_recording: value.allow_recording,
      waiting_room_enabled: value.waiting_room_enabled,
      allow_raise_hand: value.allow_raise_hand,
    },
  };
}
