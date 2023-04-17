import { BoardLists } from "@/dtos/moderator/get-activity.dto";
import { Debate } from "./debate";
import { Tag } from "./tag";

export enum ReviewItemType {
  MODERATOR,
  USER,
};

export interface ArgumentAsModerator {
  reviewItemType: ReviewItemType.MODERATOR;

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
  reviewItemType: ReviewItemType.MODERATOR;

  ticketId: number;
  debateTags: Tag[];
  boardList: BoardLists;
}

export interface DebateAsUser extends Debate {
  reviewItemType: ReviewItemType.USER;

  ticketId: number;
  debateTags: string;
  boardList: string;

  moderatorId: number;
  moderatorUsername: string;
  tags: Tag[];
}

export interface ArgumentAsUser {
  reviewItemType: ReviewItemType.USER;

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

export interface UpdateArgumentData {
  title: string;
  content: string;
}

export interface UpdateDebateData {
  title: string;
}