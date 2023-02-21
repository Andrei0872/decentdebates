export enum BoardLists {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN REVIEW',
  ACCEPTED = 'ACCEPTED',
  CANCELED = 'CANCELED',
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

export const getActivityDTO = (data: BoardData[]) => data;