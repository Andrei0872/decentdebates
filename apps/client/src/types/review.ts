import {
  ArgumentAsModerator as SharedArgumentAsModerator,
  ArgumentAsUser as SharedArgumentAsUser,
} from "@decentdebates/shared-types";
import { BoardLists } from "@/dtos/moderator/get-activity.dto";
import { Debate } from "./debate";
import { Tag } from "./tag";

export enum ReviewItemType {
  MODERATOR,
  USER,
}

export interface ArgumentAsModerator extends SharedArgumentAsModerator {
  reviewItemType: ReviewItemType.MODERATOR;
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

export interface ArgumentAsUser extends SharedArgumentAsUser {
  reviewItemType: ReviewItemType.USER;
}

export interface UpdateArgumentData {
  title: string;
  content: string;
}

export interface UpdateDebateData {
  title: string;
}
