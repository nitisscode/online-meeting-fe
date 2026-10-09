import type { Metadata } from "next";
import { Suspense } from "react";

import { CopyCode } from "@/components/meetings/copy-code";
import { DeleteMeetingForm } from "@/components/meetings/delete-meeting-form";
import { MEETING_STATUS_LABEL } from "@/constants/meetings";
import { formatDateTime } from "@/lib/format";
import { getMeeting } from "@/lib/meetings/api";

export const metadata: Metadata = {
  title: "Meeting",
};

const settingLabels = [
  ["allow_chat", "Chat"],
  ["allow_screen_share", "Screen share"],
  ["allow_recording", "Recording"],
  ["waiting_room_enabled", "Waiting room"],
  ["allow_raise_hand", "Raise hand"],
] as const;

async function MeetingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getMeeting(id);
  const settings = meeting.settings;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article className="flex flex-col gap-6 rounded-2xl border border-line bg-sand p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-pine uppercase">
              {MEETING_STATUS_LABEL[meeting.status] ?? "Unknown"}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-tight text-ink">{meeting.title}</h1>
          </div>
          <CopyCode code={meeting.meeting_code} />
        </div>
        {meeting.description ? <p className="text-ink-soft">{meeting.description}</p> : null}
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-soft">Scheduled</dt>
            <dd className="font-medium text-ink">{formatDateTime(meeting.scheduled_at)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Started</dt>
            <dd className="font-medium text-ink">{formatDateTime(meeting.started_at)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">Privacy</dt>
            <dd className="font-medium text-ink">{meeting.is_private ? "Private" : "Open"}</dd>
          </div>
          {meeting.is_private && meeting.pass_code ? (
            <div>
              <dt className="text-ink-soft">Passcode</dt>
              <dd className="font-mono font-medium text-ink">{meeting.pass_code}</dd>
            </div>
          ) : null}
        </dl>
        {settings ? (
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {settingLabels.map(([key, label]) => (
              <li key={key} className="flex items-center justify-between rounded-xl bg-paper px-3 py-2">
                <span>{label}</span>
                <span className="font-medium">{settings[key] ? "On" : "Off"}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm text-ink-soft">
          Live audio and video are not connected here. This page manages the meeting record stored by Django.
        </p>
      </article>
      <DeleteMeetingForm meetingId={meeting.id} />
    </div>
  );
}

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading meeting…</p>}>
      <MeetingDetail params={params} />
    </Suspense>
  );
}
