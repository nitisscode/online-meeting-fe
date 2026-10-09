"use client";

import { useActionState } from "react";

import { deleteMeetingAction } from "@/app/actions/meetings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DeleteMeetingForm({ meetingId }: { meetingId: string }) {
  const [state, action, pending] = useActionState(deleteMeetingAction, null);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-line bg-sand p-4">
      <h2 className="font-display text-lg text-ink">Delete meeting</h2>
      <p className="text-sm text-ink-soft">This removes the meeting record. It does not affect a live media room.</p>
      <Alert message={state?.message} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="confirm" value="yes" required />
        I want to delete this meeting
      </label>
      <input type="hidden" name="meetingId" value={meetingId} />
      <Button type="submit" variant="danger" pending={pending} className="self-start">
        Delete meeting
      </Button>
    </form>
  );
}
