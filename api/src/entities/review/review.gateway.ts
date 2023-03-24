import { IoAdapter } from '@nestjs/platform-socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse } from '@nestjs/websockets';
import { SocketIOServer } from './review.model';
import { Socket } from 'socket.io';
import { ReviewService } from './review.service';
import { UserCookieData } from '../user/user.model';
import { CommentService } from '../comment/comment.service';
import { AddCommentData, UpdateCommentData } from '../comment/comment.model';
import { config } from 'src/config';

const PORT = 3002;

@WebSocketGateway(PORT, { namespace: 'comments', cors: { origin: config.CLIENT_URL, credentials: true }, cookie: true })
export class ReviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketIOServer;

  userSockets: Map<string, UserCookieData> = new Map();

  constructor(private reviewService: ReviewService, private commentService: CommentService) { }

  afterInit(server: any) {
    console.log(`Websocket server up & running on port ${PORT}.`);
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    try {
      const user = await this.reviewService.getUserFromSocket(socket);
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

  @SubscribeMessage('comment/debate:create')
  async handleDebateCommentCreate(socket: Socket, payload: any): Promise<WsResponse> {
    try {
      const content = payload.comment;
      if (!content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = this.userSockets.get(socket.id);
      const ticketId = +this.getTicketIdFromSocket(socket);

      const commentData: AddCommentData = {
        ticketId,
        content,
        commenterId: user.id,
      };

      const insertedComment = await this.commentService.addCommentToDebate(commentData);

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit('comment/debate:create', { insertedComment });

      return {
        event: 'comment/debate:create',
        data: { insertedComment },
      };
    } catch (err) {
      this.removeUserFromRoom(socket);
    }
  }

  @SubscribeMessage('comment/debate:update')
  async handleDebateCommentUpdate(socket: Socket, payload: UpdateCommentData): Promise<string> {
    try {
      if (!payload.content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = this.userSockets.get(socket.id);

      const result = await this.commentService.updateComment(user, payload);
      if (!result.rowCount) {
        throw new WsException('No updates occurred');
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit('comment/debate:update', { updatedComment: payload });

      return 'OK';
    } catch (err) {
      console.error(err.message);
      this.removeUserFromRoom(socket);
    }
  }

  private addUserToRoom(socket: Socket, user: UserCookieData) {
    this.userSockets.set(socket.id, user);

    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.join(roomIdentifier);
  }

  private removeUserFromRoom(socket: Socket) {
    this.userSockets.delete(socket.id);

    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.leave(roomIdentifier);
  }

  private getRoomIdentifier(socket: Socket) {
    const ticketId = this.getTicketIdFromSocket(socket);
    return `review:${ticketId}`;
  }

  private getTicketIdFromSocket(socket: Socket) {
    const { ticketId } = socket.handshake.query;
    if (!ticketId || ticketId === 'undefined') {
      throw new WsException(`'ticketId' is missing.`);
    }

    return ticketId;
  }
}
