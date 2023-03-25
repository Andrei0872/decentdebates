import { IoAdapter } from "@nestjs/platform-socket.io";

export type SocketIOServer = ReturnType<IoAdapter['create']>

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
}