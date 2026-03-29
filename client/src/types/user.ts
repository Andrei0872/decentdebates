import { Tag } from "./tag";

export enum CardTypes {
  DEBATE = 'debate',
  ARGUMENT = 'argument',
};

export enum ActivityTypes {
  SOLVED = 'SOLVED',
  ONGOING = 'ONGOING',
};

export interface UserActivityDebate {
  ticketId: number;
  boardList: string;
  debateTitle: string;
  debateId: number;
  cardType: CardTypes.DEBATE;
  moderatorUsername: string;
  activityList: ActivityTypes;
  tags: Tag[];
}

export interface UserActivityArgument {
  argumentId: number;
  argumentTitle: string;
  argumentType: string;
  argumentIsDraft: boolean;
  boardList: string;
  debateTitle: string;
  debateId: number;
  cardType: CardTypes.ARGUMENT;
  moderatorUsername: string;
  activityList: ActivityTypes;
  ticketId: number;
}

export type UserActivity = UserActivityDebate | UserActivityArgument;