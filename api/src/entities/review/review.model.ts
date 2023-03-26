import { IoAdapter } from "@nestjs/platform-socket.io";
import { Debate } from "../debates/debates.model";

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

export interface DebateAsModerator extends Debate {
  ticketId: number;
  debateTags: string;
  boardList: string;
}

// Types not 100% accurate - there are a few redundant/missing properties.
// But this shouldn't cause problems because the main properties are present.
export interface DebateAsUser extends Debate {
  ticketId: number;
  debateTags: string;
  boardList: string;

  moderatorId: number;
  moderatorUsername: string;
}
