import { DebateAsModerator } from "@/types/review";
import { Tag } from "@/types/tag";
import { ModeratorDebateResponse } from "@/utils/api/review";

export enum BoardLists {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN REVIEW',
  ACCEPTED = 'ACCEPTED',
  CANCELED = 'CANCELED',
}

const BOARD_LISTS_SORT_ORDER = {
  [BoardLists.PENDING]: 0,
  [BoardLists.IN_REVIEW]: 1,
  [BoardLists.ACCEPTED]: 2,
  [BoardLists.CANCELED]: 3,
}

export enum CardLabels {
  DEBATE = 'debate',
  ARGUMENT = 'argument',
  REPORT = 'report',
}

export interface ModeratorActivityBase {
  ticketId: number;
  boardList: BoardLists;
  ticketTitle: string;
  moderatorId: number | null;
  moderatorUsername: string | null;
}

export interface ModeratorActivityDebate extends ModeratorActivityBase, DebateAsModerator {
  ticketLabel: CardLabels.DEBATE;
  tags: Tag[];
  debateId: number;
}

export interface ModeratorActivityArgument extends ModeratorActivityBase {
  ticketLabel: CardLabels.ARGUMENT;
  content?: string;
  debateId: number;
  argumentType: string;
  debateTitle: string;
  argumentId: number;
  counterargumentTo: number;
  username: string;
}

export type ModeratorActivity = ModeratorActivityArgument | ModeratorActivityDebate;

export interface BoardData {
  boardList: BoardLists;
  cards: ModeratorActivity[];
}

export const getActivityDTO = (data: BoardData[]) => {
  data.sort((b1, b2) => BOARD_LISTS_SORT_ORDER[b1.boardList] - BOARD_LISTS_SORT_ORDER[b2.boardList]);

  return data;
};