import { IoAdapter } from "@nestjs/platform-socket.io";
import { Debate } from "../debates/debates.model";

export type SocketIOServer = ReturnType<IoAdapter['create']>

export interface ArgumentAsModerator {
  ticketId: number;
  userId: number;
  debateId: number;
  argumentTitle: string;
  argumentContent: string;
  counterargumentToId: number;
  argumentType: string;
  debateTitle: string;
  boardList: string;
  counterargumentToTitle: string;
  username: string;
  assignedToId: number;
}

export interface DebateAsModerator extends Debate {
  ticketId: number;
  boardList: string;

  // Raw values.
  tags: string;
  tagsIds: string;
}

// Types not 100% accurate - there are a few redundant/missing properties.
// But this shouldn't cause problems because the main properties are present.
export interface DebateAsUser extends Debate {
  ticketId: number;
  boardList: string;

  moderatorId: number;
  moderatorUsername: string;

  // Raw values.
  tags: string;
  tagsIds: string;
}

export interface ArgumentAsUser {
  ticketId: number;
  moderatorId: number;
  debateId: number;
  argumentTitle: string;
  argumentContent: string;
  counterargumentToId: number;
  argumentType: string;
  debateTitle: string;
  boardList: string;
  counterargumentToTitle: string;
  moderatorUsername: string;
  argumentId: string;
  assignedToId: number;
  userId: number;
}

export interface UpdateReviewArgumentData {
  argumentId: number;
  title: string;
  content: string;
}

export interface UpdateReviewDebateData {
  debateId: number;
  title: string;
}

export interface CommentPayload {
  comment: string;
  userId: number;
  assignedToId: number;
}

export interface DebateCommentPayload extends CommentPayload {
  debateTitle: string;
}

export interface ArgumentCommentPayload extends CommentPayload {
  debateTitle: string;
  argumentTitle: string;
}

export interface DebateReviewUpdated {
  data: UpdateReviewDebateData;
  oldTitle: string;
  ticketId: number;
  userId: number;
  assignedToId: number;
}

export interface ArgumentReviewUpdated {
  data: UpdateReviewArgumentData;
  ticketId: number;
  debateTitle: string;
  argumentTitle: string;
  userId: number;
  assignedToId: number;
}