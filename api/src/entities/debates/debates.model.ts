import { UserCookieData } from "../user/user.model";
import { CreateArgumentDTO } from "./dtos/create-argument.dto";
import { UpdateArgumentDTO } from "./dtos/update-argument.dto";
import { UpdateDraftDTO } from "./dtos/update-draft.dto";

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

export interface UpdateDraftData {
  user: UserCookieData;
  debateId: number;
  draftId: number;
  draftData: UpdateDraftDTO;
}

export interface SubmitDraftData {
  user: UserCookieData;
  debateId: number;
  draftId: number;
  draftData: UpdateDraftDTO;
}


export interface UpdateArgumentData {
  user: UserCookieData;
  argumentId: string;
  argumentData: UpdateArgumentDTO;
}

export interface UpdateDebateData {
  user: UserCookieData;
  debateId: string;
  title: string;
}