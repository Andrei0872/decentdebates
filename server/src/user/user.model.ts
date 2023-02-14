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

export type PublicUser = Omit<User, 'password'>;

export const getPublicUser = (u: User): PublicUser => {
  const { password, ...rest } = u;

  return rest;
}