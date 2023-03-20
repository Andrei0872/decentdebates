import { IoAdapter } from "@nestjs/platform-socket.io";

export type SocketIOServer = ReturnType<IoAdapter['create']>