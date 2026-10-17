import { ChatOp, ContentType, MAX_MESSAGE_LENGTH, NOT_MEMBER_REASON, TOKEN_EXPIRED_REASON, WSCloseCode } from "@/constants/chat";
import { chatMessageSchema, type ChatMessage } from "@/lib/chat/message";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ChatSocketAuth = {
  token: string;
  socketBase: string;
};

type ChatSocketHandlers = {
  onMessage: (message: ChatMessage) => void;
  onHistory: (messages: ChatMessage[]) => void;
  onEdited: (message: ChatMessage) => void;
  onDeleted: (messageId: string) => void;
  onTyping: (userId: string, isTyping: boolean) => void;
  onError: (message: string) => void;
  onForbidden: () => void;
  onConnection: (open: boolean) => void;
};

export type ChatSocket = {
  sendMessage: (content: string) => boolean;
  editMessage: (messageId: string, content: string) => boolean;
  deleteMessage: (messageId: string) => boolean;
  setTyping: (isTyping: boolean) => boolean;
  close: () => void;
};

function textContent(content: string): string | null {
  const value = content.trim();
  if (!value || value.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  return value;
}

function visibleError(reason: unknown): string {
  if (typeof reason !== "string" || reason.startsWith("{") || reason.startsWith("{'")) {
    return "That message is not valid.";
  }
  if (reason === "Message not found" || reason === "You are not the owner of this message." || reason === NOT_MEMBER_REASON + ".") {
    return reason;
  }
  return "That message could not be sent.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function connectChat(options: {
  conversationId: string;
  getAuth: () => Promise<ChatSocketAuth>;
  refreshAuth: () => Promise<ChatSocketAuth>;
  handlers: ChatSocketHandlers;
}): ChatSocket {
  let socket: WebSocket | null = null;
  let stopped = false;
  let generation = 0;
  let attempts = 0;
  let tokenRetries = 0;
  let reconnectTimer = 0;

  const send = (op: number, data: Record<string, unknown>) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify({ op, data }));
    return true;
  };

  const open = async (refresh: boolean) => {
    if (stopped) {
      return;
    }
    const generationId = ++generation;
    let auth: ChatSocketAuth;
    try {
      auth = await (refresh ? options.refreshAuth() : options.getAuth());
    } catch (error) {
      if (!stopped && generationId === generation) {
        options.handlers.onConnection(false);
        const unavailable = error instanceof Error && error.message === "unavailable";
        options.handlers.onError(unavailable ? "The meeting service is unavailable." : "Your session has ended. Sign in again.");
      }
      return;
    }

    if (stopped || generationId !== generation) {
      return;
    }

    const url = `${auth.socketBase}/ws/chat/${options.conversationId}/?token=${encodeURIComponent(auth.token)}`;
    const ws = new WebSocket(url);
    const previous = socket;
    socket = ws;
    previous?.close();

    ws.onopen = () => {
      if (socket !== ws) {
        return;
      }
      attempts = 0;
      tokenRetries = 0;
      options.handlers.onConnection(true);
    };

    ws.onmessage = (event) => {
      if (socket !== ws || typeof event.data !== "string") {
        return;
      }
      let frame: unknown;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isRecord(frame) || typeof frame.op !== "number") {
        return;
      }

      if (frame.op === ChatOp.CHAT_HISTORY && Array.isArray(frame.data)) {
        const messages: ChatMessage[] = [];
        for (const item of frame.data) {
          const message = chatMessageSchema.safeParse(item);
          if (message.success && !message.data.is_deleted) {
            messages.push(message.data);
          }
        }
        options.handlers.onHistory(messages);
        return;
      }

      if (frame.op === ChatOp.MESSAGE_RECEIVE || frame.op === ChatOp.MESSAGE_EDIT) {
        const message = chatMessageSchema.safeParse(frame.data);
        if (!message.success) {
          return;
        }
        if (frame.op === ChatOp.MESSAGE_RECEIVE) {
          options.handlers.onMessage(message.data);
        } else {
          options.handlers.onEdited(message.data);
        }
        return;
      }

      if (frame.op === ChatOp.MESSAGE_DELETE && isRecord(frame.data) && typeof frame.data.message_id === "string") {
        if (UUID_PATTERN.test(frame.data.message_id)) {
          options.handlers.onDeleted(frame.data.message_id);
        }
        return;
      }

      if (frame.op === ChatOp.MESSAGE_TYPING && isRecord(frame.data) && typeof frame.data.user_id === "string" && typeof frame.data.is_typing === "boolean") {
        options.handlers.onTyping(frame.data.user_id, frame.data.is_typing);
        return;
      }

      if (frame.op === ChatOp.ERROR) {
        const reason = isRecord(frame.data) ? frame.data.reason : undefined;
        options.handlers.onError(visibleError(reason));
      }
    };

    ws.onclose = (event) => {
      if (socket !== ws || stopped) {
        return;
      }
      options.handlers.onConnection(false);

      const notMember = event.code === WSCloseCode.FORBIDDEN && event.reason === NOT_MEMBER_REASON;
      const tokenProblem =
        event.code === WSCloseCode.UNAUTHORIZED ||
        (event.code === WSCloseCode.FORBIDDEN && (event.reason === TOKEN_EXPIRED_REASON || event.reason === ""));
      if (tokenProblem) {
        if (tokenRetries >= 1) {
          options.handlers.onError("Your session has ended. Sign in again.");
          return;
        }
        tokenRetries += 1;
        void open(true);
        return;
      }

      if (notMember) {
        options.handlers.onForbidden();
        return;
      }

      if (attempts < 3) {
        attempts += 1;
        reconnectTimer = window.setTimeout(() => void open(false), attempts * 1000);
        return;
      }
      options.handlers.onError("Chat is not connected.");
    };
  };

  void open(false);

  return {
    sendMessage(content) {
      const value = textContent(content);
      if (!value) {
        return false;
      }
      return send(ChatOp.MESSAGE_SEND, { content: value, content_type: ContentType.TEXT });
    },
    editMessage(messageId, content) {
      const value = textContent(content);
      if (!value || !UUID_PATTERN.test(messageId)) {
        return false;
      }
      return send(ChatOp.MESSAGE_EDIT, { message_id: messageId, content: value, content_type: ContentType.TEXT });
    },
    deleteMessage(messageId) {
      if (!UUID_PATTERN.test(messageId)) {
        return false;
      }
      return send(ChatOp.MESSAGE_DELETE, { message_id: messageId });
    },
    setTyping(isTyping) {
      return send(ChatOp.MESSAGE_TYPING, { is_typing: isTyping });
    },
    close() {
      stopped = true;
      generation += 1;
      window.clearTimeout(reconnectTimer);
      socket?.close();
      socket = null;
    },
  };
}
