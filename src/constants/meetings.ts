/** Integer values from Django `MeetingStatus`. */
export const MeetingStatus = {
  Scheduled: 0,
  Live: 1,
  Ended: 2,
  Cancelled: 3,
} as const;

export const MEETING_STATUS_LABEL: Record<number, string> = {
  [MeetingStatus.Scheduled]: "Scheduled",
  [MeetingStatus.Live]: "Live",
  [MeetingStatus.Ended]: "Ended",
  [MeetingStatus.Cancelled]: "Cancelled",
};

/** Integer values from Django `ParticipantRole`. */
export const ParticipantRole = {
  Host: 0,
  CoHost: 1,
  Participant: 2,
} as const;

export const PARTICIPANT_ROLE_LABEL: Record<number, string> = {
  [ParticipantRole.Host]: "Host",
  [ParticipantRole.CoHost]: "Co-host",
  [ParticipantRole.Participant]: "Participant",
};

/** Integer values from Django `ConnectionStatus`. */
export const ConnectionStatus = {
  Connecting: 0,
  Connected: 1,
  Disconnected: 2,
  Left: 3,
  Invited: 4,
} as const;

/** Field lengths from the Meeting model. */
export const MEETING_LIMITS = {
  titleMax: 255,
  descriptionMax: 5000,
  passCodeMax: 10,
  meetingCodeLength: 10,
} as const;
