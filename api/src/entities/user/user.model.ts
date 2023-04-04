export enum UserRoles {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
};

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: UserRoles;
}

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

export type PublicUser = Omit<User, 'password'>;
export type UserCookieData = Pick<User, 'id' | 'role'>;

export const getPublicUser = (u: User): PublicUser => {
  const { password, ...rest } = u;

  return rest;
}