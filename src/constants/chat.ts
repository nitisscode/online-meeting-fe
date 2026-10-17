/**
 * Integer values from Django `apps/constants/chat.py` and `apps/chat/models.py`.
 * Op 2, 3, and 5 are used in both directions. Do not send 4 or 10–13.
 */
export const ChatOp = {
  MESSAGE_RECEIVE: 0,
  MESSAGE_SEND: 1,
  MESSAGE_EDIT: 2,
  MESSAGE_DELETE: 3,
  MESSAGE_MARKED_AS_READ: 4,
  MESSAGE_TYPING: 5,
  CHAT_HISTORY: 6,
  MESSAGE_CREATED: 10,
  MESSAGE_UPDATED: 11,
  MESSAGE_DELETED: 12,
  TYPING_UPDATE: 13,
  ERROR: 99,
} as const;

/** Django `ContentType`. The meeting chat sends text only. */
export const ContentType = {
  TEXT: 1,
  IMAGE: 2,
  VIDEO: 3,
  AUDIO: 4,
  FILE: 5,
  URL: 6,
  OTHER: 99,
} as const;

/** Django `WSStatusCodes`. 4003 is either "not a member" or "Token expired". */
export const WSCloseCode = {
  UNAUTHORIZED: 4001,
  FORBIDDEN: 4003,
} as const;

export const MAX_MESSAGE_LENGTH = 1000;

export const CONVERSATION_TYPE = {
  Group: 2,
} as const;

export const TOKEN_EXPIRED_REASON = "Token expired";
export const NOT_MEMBER_REASON = "You are not a member of this conversation";
