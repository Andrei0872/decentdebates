export enum UserRoles {
  USER,
  MODERATOR,
  ADMIN,
};

export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: UserRoles;
}

export interface UserOngoingActivity {
  ticketId: number;
  boardList: string;
  title: string;
  debateId: number;
  itemType: number;
  moderatorUsername: string;
}

export type PublicUser = Omit<User, 'password'>;
export type UserCookieData = Pick<User, 'id' | 'role'>;

export const getPublicUser = (u: User): PublicUser => {
  const { password, ...rest } = u;

  return rest;
}