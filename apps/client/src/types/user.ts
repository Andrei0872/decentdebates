import { ActivityTypes, CardTypes } from "@decentdebates/shared-types";
import { Tag } from "./tag";

export { ActivityTypes, CardTypes };

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
