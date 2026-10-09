import type { Metadata } from "next";
import { Suspense } from "react";

import { MeetingList } from "@/components/meetings/meeting-list";

export const metadata: Metadata = {
  title: "Meetings",
};

export default function DashboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Your meetings</h1>
        <p className="mt-2 text-sm text-ink-soft">Meetings you created. You are the host of each one.</p>
      </div>
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading meetings…</p>}>
        <MeetingList />
      </Suspense>
    </section>
  );
}
