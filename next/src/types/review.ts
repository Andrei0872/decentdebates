import { BoardLists } from "@/dtos/moderator/get-activity.dto";
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
  reviewItemType: ReviewItemType.MODERATOR;

  ticketId: number;
  debateTags: string;
  boardList: BoardLists;
}

export interface DebateAsUser extends Debate {
  reviewItemType: ReviewItemType.USER;
  
  ticketId: number;
  debateTags: string;
  boardList: string;

  moderatorId: number;
  moderatorUsername: string;
}
