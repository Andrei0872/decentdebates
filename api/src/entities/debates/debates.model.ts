export interface Debate {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string;
  username: string;
  userId: number;
}

export enum ArgumentType {
  PRO = 'PRO',
  CON = 'CON',
}

export interface DebateInformation {
  debateId: number;
  ticketId: number;
  title: string;
  content: string;
  createdById: number;
  type: ArgumentType;
  createdAt: string;
}