import { IoAdapter } from '@nestjs/platform-socket.io';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException, WsResponse } from '@nestjs/websockets';
import { SocketIOServer, UpdateReviewArgumentData, UpdateReviewDebateData } from './review.model';
import { Socket } from 'socket.io';
import { ReviewService } from './review.service';
import { UserCookieData, UserRoles } from '../user/user.model';
import { CommentService } from '../comment/comment.service';
import { AddCommentData, UpdateCommentData } from '../comment/comment.model';
import { config } from 'src/config';
import { DebatesService } from '../debates/debates.service';
import { UpdateArgumentData, UpdateDebateData } from '../debates/debates.model';

const PORT = 3002;

@WebSocketGateway(PORT, { namespace: 'review', cors: { origin: config.CLIENT_URL, credentials: true }, cookie: true })
export class ReviewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: SocketIOServer;

  userSockets: Map<string, UserCookieData> = new Map();

  constructor(
    private reviewService: ReviewService,
    private commentService: CommentService,
    private debatesService: DebatesService,
  ) { }

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
      this.removeUserFromRoom(socket, err.message);
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
      this.removeUserFromRoom(socket, err.message);
    }
  }

  @SubscribeMessage('comment/argument:create')
  async handleArgumentCommentCreate(socket: Socket, payload: any): Promise<WsResponse> {
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

      const insertedComment = await this.commentService.addCommentToArgument(commentData);

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit('comment/argument:create', { insertedComment });

      return {
        event: 'comment/argument:create',
        data: { insertedComment },
      };
    } catch (err) {
      this.removeUserFromRoom(socket, err.message);
    }
  }

  @SubscribeMessage('comment/argument:update')
  async handleArgumentCommentUpdate(socket: Socket, payload: UpdateCommentData): Promise<string> {
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
      socket.to(roomIdentifier).emit('comment/argument:update', { updatedComment: payload });

      return 'OK';
    } catch (err) {
      console.error(err.message);
      this.removeUserFromRoom(socket, err.message);
    }
  }

  @SubscribeMessage('argument:update')
  async handleArgumentUpdate(socket: Socket, payload: { data: UpdateReviewArgumentData }): Promise<string> {
    try {
      if (!payload.data) {
        throw new WsException(`Argument data is missing.`);
      }
      const user = this.userSockets.get(socket.id);
      if (user.role !== UserRoles.USER) {
        throw new WsException('Only users can updated their own comment.');
      }

      const argData: UpdateArgumentData = {
        user,
        argumentId: payload.data.argumentId.toString(),
        argumentData: {
          title: payload.data.title,
          content: payload.data.content,
        },
      };
      const result = await this.debatesService.updateArgument(argData);
      if (!result.rowCount) {
        throw new WsException('No updates occurred');
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit('argument:update', payload.data);

      return 'OK';
    } catch (err) {
      console.error(err.message);
      this.removeUserFromRoom(socket, err.message);
    }
  }

  @SubscribeMessage('debate:update')
  async handleDebateUpdate(socket: Socket, payload: { data: UpdateReviewDebateData }): Promise<string> {
    try {
      if (!payload.data) {
        throw new WsException(`Debate data is missing.`);
      }
      const user = this.userSockets.get(socket.id);
      if (user.role !== UserRoles.USER) {
        throw new WsException('Only users can updated their own debate.');
      }

      const debateData: UpdateDebateData = {
        debateId: payload.data.debateId.toString(),
        title: payload.data.title,
        user,
      };
      const result = await this.debatesService.updateDebate(debateData);
      if (!result.rowCount) {
        throw new WsException('No updates occurred');
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit('debate:update', payload.data);

      return 'OK';
    } catch (err) {
      console.error(err.message);
      this.removeUserFromRoom(socket, err.message);
    }
  }


  private addUserToRoom(socket: Socket, user: UserCookieData) {
    this.userSockets.set(socket.id, user);

    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.join(roomIdentifier);
  }

  private removeUserFromRoom(socket: Socket, errorMessage = null) {
    this.userSockets.delete(socket.id);

    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.leave(roomIdentifier);

    if (errorMessage) {
      socket.emit('error', { reason: errorMessage });
    }
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
