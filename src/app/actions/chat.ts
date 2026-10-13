"use server";

import { RATE_LIMIT } from "@/constants/security";
import { ApiError } from "@/lib/api/errors";
import { listConversationMessages, listMeetingMessages, sendMeetingMessage, type ChatMessage } from "@/lib/chat/api";
import { readString } from "@/lib/forms";
import { assertRateLimit, rateLimitKey, RateLimitError } from "@/lib/http/rate-limit";

export type ChatLoadResult = {
  userId: string;
  conversationId: string;
  messages: ChatMessage[];
  error?: string;
};

export type ChatSendState = {
  message?: string;
  sent?: boolean;
};

export async function loadMeetingChat(meetingId: string): Promise<ChatLoadResult> {
  try {
    return await listMeetingMessages(meetingId);
  } catch (error) {
    if (error instanceof ApiError) {
      return { userId: "", conversationId: "", messages: [], error: error.message };
    }
    throw error;
  }
}

export async function refreshMeetingChat(conversationId: string): Promise<{ messages: ChatMessage[]; error?: string }> {
  try {
    return { messages: await listConversationMessages(conversationId) };
  } catch (error) {
    if (error instanceof ApiError) {
      return { messages: [], error: error.message };
    }
    throw error;
  }
}

export async function sendMeetingChat(
  _state: ChatSendState | null,
  formData: FormData,
): Promise<ChatSendState> {
  const meetingId = readString(formData, "meetingId");
  const content = readString(formData, "content").trim();
  if (!content) {
    return { message: "Enter a message." };
  }

  try {
    await assertRateLimit(await rateLimitKey("chat-send"), RATE_LIMIT.chatSend.limit, RATE_LIMIT.chatSend.windowMs);
    await sendMeetingMessage(meetingId, content);
  } catch (error) {
    if (error instanceof RateLimitError || error instanceof ApiError) {
      return { message: error.message };
    }
    throw error;
  }

  return { sent: true };
}
