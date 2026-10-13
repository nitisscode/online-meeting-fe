import "server-only";

import { z } from "zod";

import { API_PATHS } from "@/constants/api";
import { CONVERSATION_TYPE, MESSAGE_CONTENT_TYPE } from "@/constants/chat";
import { djangoFetch } from "@/lib/api/django";
import { ApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/meetings/api";

const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

const messageSchema = z.object({
  id: z.uuid(),
  conversation: z.uuid(),
  sender: userSchema,
  content: z.string(),
  content_type: z.number().int(),
  is_edited: z.boolean(),
  edited_at: z.string().nullable(),
  created_at: z.string(),
});

const conversationSchema = z.object({
  id: z.uuid(),
  meeting: z.uuid(),
  conversation_type: z.number().int(),
  is_active: z.boolean(),
});

const participantSchema = z.object({
  id: z.uuid(),
  conversation: z.uuid(),
  participant: z.uuid(),
});

export type ChatMessage = z.infer<typeof messageSchema>;

function parseList<T>(schema: z.ZodType<T>, data: unknown): T[] {
  if (!Array.isArray(data)) {
    throw new ApiError("The meeting service returned an unexpected response.", 502);
  }
  return data.map((item) => {
    const parsed = schema.safeParse(item);
    if (!parsed.success) {
      throw new ApiError("The meeting service returned an unexpected response.", 502);
    }
    return parsed.data;
  });
}

async function findConversation(meetingId: string) {
  const data = await djangoFetch<unknown>(API_PATHS.conversations);
  return parseList(conversationSchema, data).find((item) => item.meeting === meetingId) ?? null;
}

async function ensureConversation(meetingId: string) {
  const existing = await findConversation(meetingId);
  if (existing) {
    return existing;
  }

  try {
    const created = await djangoFetch<unknown>(API_PATHS.conversations, {
      method: "POST",
      body: JSON.stringify({
        meeting: meetingId,
        conversation_type: CONVERSATION_TYPE.Group,
      }),
    });
    const parsed = conversationSchema.safeParse(created);
    if (!parsed.success) {
      throw new ApiError("The meeting service returned an unexpected response.", 502);
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      const retry = await findConversation(meetingId);
      if (retry) {
        return retry;
      }
    }
    throw error;
  }
}

async function ensureMembership(conversationId: string, userId: string) {
  const data = await djangoFetch<unknown>(API_PATHS.conversationParticipants);
  const members = parseList(participantSchema, data);
  if (members.some((member) => member.conversation === conversationId && member.participant === userId)) {
    return;
  }

  try {
    await djangoFetch<unknown>(API_PATHS.conversationParticipants, {
      method: "POST",
      body: JSON.stringify({
        conversation: conversationId,
        participant: userId,
      }),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 400) {
      throw error;
    }
    const again = parseList(
      participantSchema,
      await djangoFetch<unknown>(API_PATHS.conversationParticipants),
    );
    if (!again.some((member) => member.conversation === conversationId && member.participant === userId)) {
      throw error;
    }
  }
}

export async function listConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const parsedId = z.uuid().safeParse(conversationId);
  if (!parsedId.success) {
    throw new ApiError("That conversation id is not valid.", 400);
  }

  const data = await djangoFetch<unknown>(`${API_PATHS.messages}?conversation_id=${parsedId.data}`);
  return parseList(messageSchema, data);
}

export async function listMeetingMessages(meetingId: string): Promise<{ userId: string; conversationId: string; messages: ChatMessage[] }> {
  const parsedId = z.uuid().safeParse(meetingId);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }

  const user = await getCurrentUser();
  const conversation = await ensureConversation(parsedId.data);
  await ensureMembership(conversation.id, user.id);

  return {
    userId: user.id,
    conversationId: conversation.id,
    messages: await listConversationMessages(conversation.id),
  };
}

export async function sendMeetingMessage(meetingId: string, content: string): Promise<ChatMessage> {
  const parsedId = z.uuid().safeParse(meetingId);
  if (!parsedId.success) {
    throw new ApiError("That meeting id is not valid.", 400);
  }

  const user = await getCurrentUser();
  const conversation = await ensureConversation(parsedId.data);
  await ensureMembership(conversation.id, user.id);
  const data = await djangoFetch<unknown>(API_PATHS.messages, {
    method: "POST",
    body: JSON.stringify({
      conversation: conversation.id,
      content,
      content_type: MESSAGE_CONTENT_TYPE.Text,
    }),
  });
  const parsed = messageSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError("The meeting service returned an unexpected response.", 502);
  }
  return parsed.data;
}
