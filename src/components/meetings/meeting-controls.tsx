"use client";

import { useActionState } from "react";

import { endMeetingAction, enterMeetingAction, startMeetingAction } from "@/app/actions/meetings";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MeetingStatus } from "@/constants/meetings";

export function MeetingControls({ meetingId, status }: { meetingId: string; status: number }) {
  const [startState, startAction, startPending] = useActionState(startMeetingAction, null);
  const [endState, endAction, endPending] = useActionState(endMeetingAction, null);
  const [enterState, enterAction, enterPending] = useActionState(enterMeetingAction, null);
  const message = startState?.message ?? endState?.message ?? enterState?.message;

  return (
    <div className="flex flex-col gap-3">
      <Alert message={message} />
      <div className="flex flex-wrap gap-2">
        {status === MeetingStatus.Scheduled ? (
          <form action={startAction}>
            <input type="hidden" name="meetingId" value={meetingId} />
            <Button type="submit" pending={startPending}>
              Start meeting
            </Button>
          </form>
        ) : null}
        {status === MeetingStatus.Live ? (
          <>
            <form action={enterAction}>
              <input type="hidden" name="meetingId" value={meetingId} />
              <Button type="submit" pending={enterPending}>
                Enter room
              </Button>
            </form>
            <form action={endAction}>
              <input type="hidden" name="meetingId" value={meetingId} />
              <Button type="submit" variant="danger" pending={endPending}>
                End meeting
              </Button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
