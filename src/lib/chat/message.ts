import { z } from "zod";

const userSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.uuid(),
  conversation: z.uuid(),
  sender: userSchema,
  content: z.string(),
  content_type: z.number().int(),
  is_edited: z.boolean(),
  edited_at: z.string().nullable(),
  created_at: z.string(),
  is_deleted: z.boolean().default(false),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export type ChatItem = ChatMessage & {
  pending?: boolean;
};

export function sameUser(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

export function isSavedMessage(id: string): boolean {
  return !id.startsWith("local-");
}

export function mergeMessages(server: ChatMessage[], current: ChatItem[], userId: string): ChatItem[] {
  const visible = server.filter((message) => !message.is_deleted);
  const visibleIds = new Set(visible.map((message) => message.id));
  const knownIds = new Set(current.filter((message) => isSavedMessage(message.id)).map((message) => message.id));
  const freshMine = visible.filter((message) => !knownIds.has(message.id) && (!userId || sameUser(message.sender.id, userId)));
  const pool = [...freshMine];
  const now = Date.now();
  const unmatched = current.filter((message) => !isSavedMessage(message.id)).filter((message) => {
    const index = pool.findIndex((item) => item.content === message.content);
    if (index === -1) {
      const sentAt = new Date(message.created_at).getTime();
      return Number.isNaN(sentAt) || now - sentAt < 5000;
    }
    pool.splice(index, 1);
    return false;
  });
  const arrivedLive = current.filter((message) => isSavedMessage(message.id) && !visibleIds.has(message.id) && !message.is_deleted);

  return [...visible, ...arrivedLive, ...unmatched].sort((left, right) => left.created_at.localeCompare(right.created_at));
}
