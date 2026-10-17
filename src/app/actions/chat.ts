"use server";

import { ApiError } from "@/lib/api/errors";
import { listConversationMessages, listMeetingMessages } from "@/lib/chat/api";
import type { ChatMessage } from "@/lib/chat/message";

export type ChatLoadResult = {
  userId: string;
  conversationId: string;
  messages: ChatMessage[];
  error?: string;
};

export async function loadMeetingChat(meetingId: string, conversationId?: string | null): Promise<ChatLoadResult> {
  try {
    return await listMeetingMessages(meetingId, conversationId);
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
