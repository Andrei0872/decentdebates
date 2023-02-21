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
  DEBATE,
  ARGUMENT,
  REPORT,
}

// TODO: other props.
export interface CardData {
  ticketTitle: string;
  // label: CardLabels;
  // moderatorUsername: string;
  moderatorId: number;
  ticketId: number;
}

export interface BoardData {
  boardList: BoardLists;
  cards: CardData[];
}

export const getActivityDTO = (data: BoardData[]) => {
  data.sort((b1, b2) => BOARD_LISTS_SORT_ORDER[b1.boardList] - BOARD_LISTS_SORT_ORDER[b2.boardList]);

  return data;
};