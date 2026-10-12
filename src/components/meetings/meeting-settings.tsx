"use client";

import { useRef, useState } from "react";

import { updateMeetingSettingsAction } from "@/app/actions/meetings";
import { Alert } from "@/components/ui/alert";

const settingFields = [
  ["allow_chat", "Chat"],
  ["allow_screen_share", "Screen share"],
  ["allow_recording", "Recording"],
  ["waiting_room_enabled", "Waiting room"],
  ["allow_raise_hand", "Raise hand"],
] as const;

type SettingKey = (typeof settingFields)[number][0];

type SettingValues = Record<SettingKey, boolean>;

export function MeetingSettings({
  meetingId,
  settings,
  canEdit,
}: {
  meetingId: string;
  settings: SettingValues;
  canEdit: boolean;
}) {
  const [values, setValues] = useState<SettingValues>({
    allow_chat: settings.allow_chat,
    allow_screen_share: settings.allow_screen_share,
    allow_recording: settings.allow_recording,
    waiting_room_enabled: settings.waiting_room_enabled,
    allow_raise_hand: settings.allow_raise_hand,
  });
  const [message, setMessage] = useState<string | undefined>();
  const saving = useRef(false);

  async function toggle(key: SettingKey) {
    if (!canEdit || saving.current) {
      return;
    }

    const previous = values;
    const next = { ...values, [key]: !values[key] };
    saving.current = true;
    setValues(next);
    setMessage(undefined);

    const result = await updateMeetingSettingsAction(meetingId, next);
    saving.current = false;
    if (result.message) {
      setValues(previous);
      setMessage(result.message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Alert message={message} />
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {settingFields.map(([key, label]) => {
          const on = values[key];
          return (
            <li key={key} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2">
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${label}, ${on ? "on" : "off"}`}
                disabled={!canEdit}
                onClick={() => toggle(key)}
                className={`relative h-6 w-11 shrink-0 rounded-full disabled:cursor-not-allowed ${on ? "bg-pine" : "bg-line"} ${canEdit ? "" : "opacity-60"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-foam transition ${on ? "translate-x-5" : ""}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
