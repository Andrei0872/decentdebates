import { UpdateTicketDTO } from "./dtos/update-ticket.dto";


export enum CardLabels {
  DEBATE = 'debate',
  ARGUMENT = 'argument',
  REPORT = 'report',
}

export interface ModeratorActivityBase {
  ticketId: number;
  boardList: string;
  ticketTitle: string;
  moderatorId: number;
  moderatorUsername: string;
}

export interface ModeratorActivityDebate extends ModeratorActivityBase {
  ticketLabel: CardLabels.DEBATE;
  tags: string;
}

export interface ModeratorActivityArgument extends ModeratorActivityBase {
  ticketLabel: CardLabels.ARGUMENT;
  content?: string;
  debateId: number;
  argumentType: string;
  debateTitle: string;
  argumentId: number;
}

export type ModeratorActivity = ModeratorActivityArgument | ModeratorActivityDebate;

export interface UpdateTicketData {
  ticketId: string;
  ticketData: UpdateTicketDTO;
  userId: number;
}