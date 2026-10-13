"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { loadMeetingChat, refreshMeetingChat, sendMeetingChat, type ChatLoadResult } from "@/app/actions/chat";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { displayName, formatDateTime, formatRelativeTime } from "@/lib/format";

const REFRESH_MS = 5000;

export function MeetingChat({ meetingId }: { meetingId: string }) {
  const [chat, setChat] = useState<ChatLoadResult>({ userId: "", conversationId: "", messages: [] });
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [sendState, sendAction, sendPending] = useActionState(sendMeetingChat, null);
  const [handledSend, setHandledSend] = useState<typeof sendState>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    conversationRef.current = "";

    async function refresh() {
      const conversationId = conversationRef.current;
      if (!conversationId) {
        const result = await loadMeetingChat(meetingId);
        if (cancelled) {
          return;
        }
        conversationRef.current = result.conversationId;
        setChat(result);
        return;
      }

      const result = await refreshMeetingChat(conversationId);
      if (cancelled) {
        return;
      }
      setChat((current) => ({
        ...current,
        messages: result.error ? current.messages : result.messages,
        error: result.error,
      }));
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [meetingId, sendState]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (sendState?.sent && sendState !== handledSend) {
    setHandledSend(sendState);
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <h2 className="font-display text-xl text-ink">Chat</h2>
      <Alert message={chat.error ?? (sendState?.sent ? undefined : sendState?.message)} />
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {chat.messages.length === 0 ? <li className="text-sm text-ink-soft">No messages yet.</li> : null}
        {chat.messages.map((message) => (
          <li key={message.id} className="rounded-xl bg-paper px-3 py-2">
            <p className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-ink">
                {message.sender.id === chat.userId ? "You" : displayName(message.sender)}
              </span>
              <span className="text-xs text-ink-soft" title={formatDateTime(message.created_at)}>
                {formatRelativeTime(message.created_at, now)}
              </span>
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-ink">{message.content}</p>
          </li>
        ))}
        <div ref={bottomRef} />
      </ul>
      <form action={sendAction} className="flex flex-col gap-2">
        <input type="hidden" name="meetingId" value={meetingId} />
        <textarea
          name="content"
          value={draft}
          rows={3}
          required
          placeholder="Write a message"
          onChange={(event) => setDraft(event.target.value)}
          className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-pine/30 focus:ring-2"
        />
        <Button type="submit" pending={sendPending} disabled={draft.trim().length === 0} className="self-end">
          Send
        </Button>
      </form>
    </div>
  );
}
