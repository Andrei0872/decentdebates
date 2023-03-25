export enum ReviewArgumentTypes {
  MODERATOR,
  USER,
};

export interface ArgumentAsModerator {
  reviewArgumentType: ReviewArgumentTypes;
  
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
}