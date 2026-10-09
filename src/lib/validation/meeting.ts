import "server-only";

import { z } from "zod";

import { MEETING_LIMITS, MeetingStatus } from "@/constants/meetings";

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
    is_private: z.boolean(),
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
      const time = new Date(value.scheduled_at);
      if (!value.scheduled_at || Number.isNaN(time.getTime())) {
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

    if (value.is_private && value.pass_code.length < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["pass_code"],
        message: "Private meetings need a passcode of at least 4 characters.",
      });
    }
  });

export type CreateMeetingForm = z.infer<typeof createMeetingSchema>;

export function toCreateMeetingInput(value: CreateMeetingForm) {
  const startNow = value.timing === "now";
  return {
    title: value.title,
    description: value.description,
    status: startNow ? MeetingStatus.Live : MeetingStatus.Scheduled,
    scheduled_at: startNow ? null : new Date(value.scheduled_at).toISOString(),
    started_at: startNow ? new Date().toISOString() : null,
    is_private: value.is_private,
    pass_code: value.pass_code.length > 0 ? value.pass_code : null,
    settings: {
      allow_chat: value.allow_chat,
      allow_screen_share: value.allow_screen_share,
      allow_recording: value.allow_recording,
      waiting_room_enabled: value.waiting_room_enabled,
      allow_raise_hand: value.allow_raise_hand,
    },
  };
}
