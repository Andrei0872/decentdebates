import {
  ActivityTypes,
  CardTypes,
  PublicUser,
  UserRoles,
} from "@decentdebates/shared-types";

export { ActivityTypes, CardTypes, PublicUser, UserRoles };

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: UserRoles;
}

export interface UserActivityDebate {
  ticketId: number;
  boardList: string;
  debateTitle: string;
  debateId: number;
  cardType: CardTypes.DEBATE;
  moderatorUsername: string;
  activityList: ActivityTypes;

  // Raw values.
  tags: string;
  tagsIds: string;
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

export type UserCookieData = Pick<User, "id" | "role" | "username">;

export const getPublicUser = (u: User): PublicUser => {
  const { password, ...rest } = u;

  return rest;
};
