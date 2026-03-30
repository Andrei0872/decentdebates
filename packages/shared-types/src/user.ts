export enum UserRoles {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface PublicUser {
  id: number;
  username: string;
  email: string;
  role: UserRoles;
}

export enum CardTypes {
  DEBATE = 'debate',
  ARGUMENT = 'argument',
}

export enum ActivityTypes {
  SOLVED = 'SOLVED',
  ONGOING = 'ONGOING',
}
