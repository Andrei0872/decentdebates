import { IoAdapter } from '@nestjs/platform-socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse } from '@nestjs/websockets';
import { SocketIOServer } from './review.model';
import { Socket } from 'socket.io';
import { ReviewService } from './review.service';
import { UserCookieData } from '../user/user.model';

const PORT = 3002;

@WebSocketGateway(PORT, { namespace: 'comments', cors: { origin: 'http://localhost:3000', credentials: true }, cookie: true })
export class ReviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketIOServer;

  constructor(private reviewService: ReviewService) { }

  afterInit(server: any) {
    console.log(`Websocket server up & running on port ${PORT}.`);
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    try {
      const user = await this.reviewService.getUserFromSocket(socket);

      // TODO: attach `user` to `socket`. E.g. by using a `Map`.

      this.addUserToRoom(socket, user);
    } catch (err) {
      console.error(err.message);

      socket.emit('error', { reason: err.message });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    try {
      this.removeUserFromRoom(socket);
    } catch (err) {
      console.error(err.message);
    }
  }

  @SubscribeMessage('comment:create')
  handleMessage(socket: Socket, payload: any): string {
    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.to(roomIdentifier).emit('comment:create', payload);
    
    return null;
  }

  private addUserToRoom(socket: Socket, user: UserCookieData) {
    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.join(roomIdentifier);
  }

  private removeUserFromRoom(socket: Socket) {
    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.leave(roomIdentifier);
  }

  private getRoomIdentifier(socket: Socket) {
    const { ticketId } = socket.handshake.query;
    if (!ticketId) {
      throw new WsException(`'ticketId' is missing.`);
    }

    return `review:${ticketId}`;
  }
}
