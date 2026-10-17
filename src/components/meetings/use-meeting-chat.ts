"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { loadMeetingChat, refreshMeetingChat } from "@/app/actions/chat";
import { MAX_MESSAGE_LENGTH } from "@/constants/chat";
import { isSavedMessage, mergeMessages, sameUser, type ChatItem, type ChatMessage } from "@/lib/chat/message";
import { connectChat, type ChatSocket, type ChatSocketAuth } from "@/lib/chat/socket";

const TYPING_IDLE_MS = 3000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function replacePending(current: ChatItem[], message: ChatMessage): ChatItem[] {
  if (current.some((item) => item.id === message.id)) {
    return current.map((item) => (item.id === message.id ? message : item));
  }
  const pendingIndex = current.findIndex((item) => !isSavedMessage(item.id) && item.content === message.content && sameUser(item.sender.id, message.sender.id));
  if (pendingIndex === -1) {
    return [...current, message];
  }
  const next = [...current];
  next[pendingIndex] = message;
  return next;
}

async function readSocketAuth(refresh: boolean): Promise<ChatSocketAuth> {
  const response = await fetch(refresh ? "/api/chat/token?refresh=1" : "/api/chat/token", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(response.status === 503 ? "unavailable" : "unauthorized");
  }
  const body = (await response.json()) as Partial<ChatSocketAuth>;
  if (!body.token || !body.socketBase) {
    throw new Error("unauthorized");
  }
  return { token: body.token, socketBase: body.socketBase };
}

export function useMeetingChat({
  meetingId,
  conversationId: knownConversationId,
  composerOpen,
}: {
  meetingId: string;
  conversationId: string | null;
  composerOpen: boolean;
}) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [userId, setUserId] = useState("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [socketKey, setSocketKey] = useState(0);
  const messagesRef = useRef<ChatItem[]>([]);
  const socketRef = useRef<ChatSocket | null>(null);
  const typingRef = useRef(false);
  const typingTimerRef = useRef(0);
  const userIdRef = useRef("");
  const conversationRef = useRef("");
  const forbiddenRetryRef = useRef(false);

  function commitMessages(updater: (current: ChatItem[]) => ChatItem[]) {
    const next = updater(messagesRef.current);
    messagesRef.current = next;
    setMessages(next);
    return next;
  }

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (composerOpen) {
      return;
    }
    window.clearTimeout(typingTimerRef.current);
    if (typingRef.current) {
      socketRef.current?.setTyping(false);
      typingRef.current = false;
    }
  }, [composerOpen]);

  useEffect(() => {
    let cancelled = false;
    const authPromise = readSocketAuth(false);
    const historyPromise = loadMeetingChat(meetingId, knownConversationId);

    function applyHistory(result: Awaited<ReturnType<typeof loadMeetingChat>>) {
      if (cancelled) {
        return;
      }
      setUserId(result.userId);
      commitMessages((current) =>
        current.some((item) => !isSavedMessage(item.id)) ? mergeMessages(result.messages, current, result.userId) : result.messages,
      );
      setError(result.error);
      setLoaded(true);
    }

    function openSocket(conversationId: string) {
      if (cancelled || !conversationId) {
        return;
      }
      conversationRef.current = conversationId;
      const socket = connectChat({
        conversationId,
        getAuth: () => authPromise,
        refreshAuth: () => readSocketAuth(true),
        handlers: {
          onMessage(message) {
            if (message.is_deleted) {
              return;
            }
            setTypingUsers((current) => current.filter((id) => id !== message.sender.id));
            commitMessages((current) => replacePending(current, message));
          },
          onHistory(history) {
            commitMessages((current) => mergeMessages(history, current, userIdRef.current));
            setLoaded(true);
          },
          onEdited(message) {
            commitMessages((current) => {
              if (message.is_deleted) {
                return current.filter((item) => item.id !== message.id);
              }
              return current.some((item) => item.id === message.id)
                ? current.map((item) => (item.id === message.id ? message : item))
                : [...current, message];
            });
          },
          onDeleted(messageId) {
            commitMessages((current) => current.filter((item) => item.id !== messageId));
          },
          onTyping(id, isTyping) {
            setTypingUsers((current) => {
              if (isTyping) {
                return current.includes(id) ? current : [...current, id];
              }
              return current.filter((item) => item !== id);
            });
          },
          onError(message) {
            setError(message);
          },
          onForbidden() {
            if (forbiddenRetryRef.current) {
              setError("Join the meeting before using chat.");
              return;
            }
            forbiddenRetryRef.current = true;
            void loadMeetingChat(meetingId, conversationId).then((result) => {
              if (cancelled) {
                return;
              }
              if (result.error || !result.conversationId) {
                setError(result.error ?? "Join the meeting before using chat.");
                return;
              }
              setSocketKey((value) => value + 1);
            });
          },
          onConnection(open) {
            setConnected(open);
          },
        },
      });
      socketRef.current = socket;
    }

    if (knownConversationId) {
      openSocket(knownConversationId);
      void historyPromise.then(applyHistory);
    } else {
      void historyPromise.then((result) => {
        applyHistory(result);
        openSocket(result.conversationId);
      });
    }

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
      window.clearTimeout(typingTimerRef.current);
      typingRef.current = false;
    };
  }, [meetingId, knownConversationId, socketKey]);

  function stopTyping() {
    window.clearTimeout(typingTimerRef.current);
    if (typingRef.current) {
      socketRef.current?.setTyping(false);
      typingRef.current = false;
    }
  }

  function onDraftChange(value: string) {
    setDraft(value);
    if (editingId) {
      return;
    }
    const socket = socketRef.current;
    if (!socket || !value.trim()) {
      stopTyping();
      return;
    }
    if (!typingRef.current) {
      typingRef.current = socket.setTyping(true);
    }
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
  }

  function beginEdit(message: ChatMessage) {
    stopTyping();
    setEditingId(message.id);
    setDraft(message.content);
    setError(undefined);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem("content");
    const value = (field instanceof HTMLTextAreaElement ? field.value : draft).trim();
    if (!value) {
      setError("Enter a message.");
      return;
    }
    if (value.length > MAX_MESSAGE_LENGTH) {
      setError("Messages can be up to 1000 characters.");
      return;
    }

    const socket = socketRef.current;
    if (!socket || !connected) {
      setError("Chat is not connected.");
      return;
    }

    if (editingId) {
      if (!socket.editMessage(editingId, value)) {
        setError("Chat is not connected.");
        return;
      }
      setEditingId(null);
      setDraft("");
      setError(undefined);
      return;
    }

    if (!socket.sendMessage(value)) {
      setError("Chat is not connected.");
      return;
    }

    const localId = `local-${crypto.randomUUID()}`;
    const local: ChatItem = {
      id: localId,
      pending: true,
      conversation: conversationRef.current,
      sender: { id: userIdRef.current, username: "", email: "", first_name: "", last_name: "" },
      content: value,
      content_type: 1,
      is_edited: false,
      edited_at: null,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    commitMessages((current) => [...current, local]);
    setDraft("");
    setError(undefined);
    stopTyping();
    void confirmSent(localId, value);
  }

  function messageWasSaved(localId: string, content: string): boolean {
    return messagesRef.current.some(
      (item) =>
        item.id !== localId &&
        isSavedMessage(item.id) &&
        item.content === content &&
        sameUser(item.sender.id, userIdRef.current),
    );
  }

  async function confirmSent(localId: string, content: string) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (messageWasSaved(localId, content)) {
        return;
      }
      if (attempt > 0) {
        await wait(250 * attempt);
      }
      const settled = await pullHistory(localId);
      if (settled || messageWasSaved(localId, content)) {
        return;
      }
    }

    if (messageWasSaved(localId, content)) {
      return;
    }

    commitMessages((current) => current.filter((item) => item.id !== localId));
    setError("That message was not sent. Try again.");
  }

  async function pullHistory(localId: string): Promise<boolean> {
    const result = await refreshMeetingChat(conversationRef.current);
    if (result.error) {
      return false;
    }
    const next = commitMessages((current) => mergeMessages(result.messages, current, userIdRef.current));
    return !next.some((item) => item.id === localId);
  }

  function removeMessage(messageId: string) {
    if (!socketRef.current?.deleteMessage(messageId)) {
      setError("Chat is not connected.");
      return;
    }
    commitMessages((current) => current.filter((item) => item.id !== messageId));
    if (editingId === messageId) {
      cancelEdit();
    }
  }

  return {
    messages,
    userId,
    draft,
    editingId,
    typingUsers,
    connected,
    loaded,
    error,
    onDraftChange,
    onSubmit,
    beginEdit,
    cancelEdit,
    removeMessage,
  };
}
