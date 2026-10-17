"use client";

import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_LENGTH } from "@/constants/chat";
import { displayName, formatDateTime, formatRelativeTime } from "@/lib/format";
import { isSavedMessage, sameUser } from "@/lib/chat/message";
import type { useMeetingChat } from "@/components/meetings/use-meeting-chat";

type ChatController = ReturnType<typeof useMeetingChat>;

type ChatParticipant = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
};

function messageTime(createdAt: string, editedAt: string | null, now: number): { text: string; title: string } {
  const sent = formatRelativeTime(createdAt, now);
  const sentExact = formatDateTime(createdAt);
  if (!editedAt) {
    return { text: sent, title: sentExact };
  }
  const edited = formatRelativeTime(editedAt, now);
  return {
    text: edited === sent ? `${sent} · edited` : `${sent} · edited ${edited}`,
    title: `Sent ${sentExact}\nEdited ${formatDateTime(editedAt)}`,
  };
}

function typingText(userIds: string[], participants: ChatParticipant[], selfId: string): string {
  const names = userIds
    .filter((id) => id !== selfId)
    .map((id) => {
      const person = participants.find((participant) => participant.user.id === id);
      return person ? displayName(person.user) : "Someone";
    });
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return `${names[0]} is typing`;
  }
  return `${names.slice(0, 2).join(" and ")} are typing`;
}

export function MeetingChat({ chat, participants }: { chat: ChatController; participants: ChatParticipant[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  const typing = typingText(chat.typingUsers, participants, chat.userId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [chat.messages]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <h2 className="font-display text-xl text-ink">Chat</h2>
      <Alert message={chat.error} />
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {chat.loaded && chat.messages.length === 0 ? <li className="text-sm text-ink-soft">No messages yet.</li> : null}
        {chat.messages.map((message) => {
          const mine = !isSavedMessage(message.id) || sameUser(message.sender.id, chat.userId);
          const time = messageTime(message.created_at, message.is_edited ? message.edited_at : null, now);
          return (
            <li key={message.id} className="rounded-xl bg-paper px-3 py-2">
              <p className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-ink">{mine ? "You" : displayName(message.sender)}</span>
                <span className="shrink-0 text-xs text-ink-soft" title={time.title}>
                  {time.text}
                </span>
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-ink">{message.content}</p>
              {mine && isSavedMessage(message.id) ? (
                <p className="mt-1 flex gap-3">
                  <button type="button" className="text-xs text-ink-soft hover:text-ink" onClick={() => chat.beginEdit(message)}>
                    Edit
                  </button>
                  <button type="button" className="text-xs text-ink-soft hover:text-ink" onClick={() => chat.removeMessage(message.id)}>
                    Delete
                  </button>
                </p>
              ) : null}
            </li>
          );
        })}
        <div ref={bottomRef} />
      </ul>
      {typing ? <p className="text-xs text-ink-soft">{typing}</p> : null}
      {!chat.connected && !chat.error ? <p className="text-xs text-ink-soft">Connecting to chat…</p> : null}
      <form onSubmit={(event) => void chat.onSubmit(event)} className="flex flex-col gap-2">
        <textarea
          name="content"
          value={chat.draft}
          rows={3}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={chat.editingId ? "Edit message" : "Write a message"}
          onChange={(event) => chat.onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
              return;
            }
            event.preventDefault();
            const form = event.currentTarget.form;
            if (!form || !chat.connected || event.currentTarget.value.trim().length === 0) {
              return;
            }
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          }}
          className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-pine/30 focus:ring-2"
        />
        <div className="flex justify-end gap-2">
          {chat.editingId ? (
            <Button type="button" variant="ghost" onClick={chat.cancelEdit}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={chat.draft.trim().length === 0 || !chat.connected}>
            {chat.editingId ? "Save" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
