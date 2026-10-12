import type { Metadata } from "next";
import { Suspense } from "react";

import { MeetingRoom } from "@/components/meetings/meeting-room";
import { getMeetingRoom } from "@/lib/meetings/api";

export const metadata: Metadata = {
  title: "Meeting room",
};

async function Room({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await getMeetingRoom(id);
  return <MeetingRoom room={room} />;
}

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-ink-soft">Opening the meeting…</p>}>
      <Room params={params} />
    </Suspense>
  );
}
