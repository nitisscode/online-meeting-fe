"use client";

import { useActionState, useState } from "react";

import { createMeetingAction } from "@/app/actions/meetings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { MEETING_LIMITS } from "@/constants/meetings";

const settings = [
  { name: "allow_chat", label: "Allow chat", defaultChecked: true },
  { name: "allow_screen_share", label: "Allow screen share", defaultChecked: true },
  { name: "allow_raise_hand", label: "Allow raise hand", defaultChecked: true },
  { name: "waiting_room_enabled", label: "Waiting room", defaultChecked: false },
  { name: "allow_recording", label: "Allow recording", defaultChecked: false },
] as const;

export function MeetingForm() {
  const [state, action, pending] = useActionState(createMeetingAction, null);
  const [timing, setTiming] = useState<"now" | "schedule">("now");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [passCode, setPassCode] = useState("");
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Alert message={state?.message} />
      <Field
        label="Title"
        name="title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        errors={errors?.title}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(errors?.description?.length)}
          aria-describedby={errors?.description?.length ? "description-error" : undefined}
          className="rounded-xl border border-line bg-sand px-3 py-2 text-ink outline-none ring-pine/30 focus:ring-2"
        />
        {errors?.description?.length ? (
          <p id="description-error" className="text-sm text-danger">
            {errors.description.join(" ")}
          </p>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-ink">When</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="timing"
            value="now"
            checked={timing === "now"}
            onChange={() => setTiming("now")}
          />
          Start now
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="timing"
            value="schedule"
            checked={timing === "schedule"}
            onChange={() => setTiming("schedule")}
          />
          Schedule
        </label>
        {timing === "schedule" ? (
          <Field
            label="Date and time"
            name="scheduled_at"
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            errors={errors?.scheduled_at}
          />
        ) : (
          <input type="hidden" name="scheduled_at" value="" />
        )}
      </fieldset>

      <Field
        label="Passcode"
        name="pass_code"
        autoComplete="off"
        maxLength={MEETING_LIMITS.passCodeMax}
        value={passCode}
        onChange={(event) => setPassCode(event.target.value)}
        errors={errors?.pass_code}
      />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-medium text-ink sm:col-span-2">Room settings</legend>
        {settings.map((setting) => (
          <label key={setting.name} className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name={setting.name} value="yes" defaultChecked={setting.defaultChecked} />
            {setting.label}
          </label>
        ))}
      </fieldset>

      <Button type="submit" pending={pending} className="self-start">
        Create meeting
      </Button>
    </form>
  );
}
