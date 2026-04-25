export enum ArgumentType {
  PRO = "PRO",
  CON = "CON",
}

export interface DebateArgument {
  argumentId: number;
  debateId: number;
  debateTitle: string;
  ticketId: number;
  title: string;
  content?: string;
  createdById: number;
  argumentType: ArgumentType;
  createdAt: string;
  username: string;
  counterargumentTo?: number | null;
  counterarguments?: number[] | null;
}
