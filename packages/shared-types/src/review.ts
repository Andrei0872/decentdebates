export interface ArgumentAsModerator {
  ticketId: number;
  userId: number;
  debateId: number;
  argumentTitle: string;
  argumentContent: string;
  counterargumentToId: number;
  argumentType: string;
  debateTitle: string;
  boardList: string;
  counterargumentToTitle: string;
  username: string;
  assignedToId: number;
}

export interface ArgumentAsUser {
  ticketId: number;
  moderatorId: number;
  debateId: number;
  argumentTitle: string;
  argumentContent: string;
  counterargumentToId: number;
  argumentType: string;
  debateTitle: string;
  boardList: string;
  counterargumentToTitle: string;
  moderatorUsername: string;
  argumentId: string;
  assignedToId: number;
  userId: number;
}
