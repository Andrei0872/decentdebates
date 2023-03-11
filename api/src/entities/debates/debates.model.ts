import { UserCookieData } from "../user/user.model";
import { CreateArgumentDTO } from "./dtos/create-argument.dto";

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

export interface DebateArgument {
  argumentId: number;
  debateId: number;
  debateTitle: string;
  ticketId: number;
  title: string;
  createdById: number;
  argumentType: ArgumentType;
  createdAt: string;
  username: string;
  counterargumentTo: number;
}

export interface DetailedDebateArgument extends DebateArgument {
  content: string;
}

export interface CreateArgumentData {
  user: UserCookieData;
  debateId: number;
  argumentDetails: CreateArgumentDTO;
}

export interface GetDraftData {
  user: UserCookieData;
  debateId: number;
  argumentId: number;
}