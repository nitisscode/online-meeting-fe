import Link from "next/link";

import { MEETING_STATUS_LABEL } from "@/constants/meetings";
import { ROUTES } from "@/constants/routes";
import { formatDateTime } from "@/lib/format";
import { listMeetings } from "@/lib/meetings/api";
import type { MeetingSummary } from "@/lib/meetings/api";

function statusClass(status: number): string {
  if (status === 1) {
    return "bg-pine/10 text-pine";
  }
  if (status === 2 || status === 3) {
    return "bg-ink/5 text-ink-soft";
  }
  return "bg-warn/10 text-warn";
}

function MeetingRow({ meeting }: { meeting: MeetingSummary }) {
  const when = meeting.scheduled_at ?? meeting.started_at;

  return (
    <li>
      <Link
        href={ROUTES.meeting(meeting.id)}
        className="flex flex-col gap-2 rounded-2xl border border-line bg-sand px-4 py-4 transition hover:border-pine/40 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-medium text-ink">{meeting.title}</p>
          <p className="text-sm text-ink-soft">{formatDateTime(when)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-ink-soft">{meeting.meeting_code}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(meeting.status)}`}>
            {MEETING_STATUS_LABEL[meeting.status] ?? "Unknown"}
          </span>
        </div>
      </Link>
    </li>
  );
}

export async function MeetingList() {
  const meetings = await listMeetings();

  if (meetings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-sand px-6 py-10 text-center">
        <p className="font-display text-2xl text-ink">No meetings yet</p>
        <p className="mt-2 text-sm text-ink-soft">Create one and you will be the host.</p>
        <Link href={ROUTES.newMeeting} className="mt-4 inline-flex text-sm font-semibold text-pine">
          New meeting
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {meetings.map((meeting) => (
        <MeetingRow key={meeting.id} meeting={meeting} />
      ))}
    </ul>
  );
}
