import { Debate } from "./debate";

export enum ReviewItemType {
  MODERATOR,
  USER,
};

export interface ArgumentAsModerator {
  reviewItemType: ReviewItemType;

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
}

export interface DebateAsModerator extends Debate {
  reviewItemType: ReviewItemType;

  ticketId: number;
  debateTags: string;
  boardList: string;
}