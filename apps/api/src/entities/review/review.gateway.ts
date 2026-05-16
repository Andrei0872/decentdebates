import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from "@nestjs/websockets";
import {
  ArgumentCommentPayload,
  ArgumentReviewUpdated,
  DebateCommentPayload,
  DebateReviewUpdated,
  SocketIOServer,
} from "./review.model";
import { Socket } from "socket.io";
import { ReviewService } from "./review.service";
import { UserCookieData, UserRoles } from "../user/user.model";
import { CommentService } from "../comment/comment.service";
import { AddCommentData, UpdateCommentData } from "../comment/comment.model";
import { config } from "src/config";
import { DebatesService } from "../debates/debates.service";
import { UpdateArgumentData, UpdateDebateData } from "../debates/debates.model";
import {
  ArgumentReviewNewComment,
  DebateReviewNewComment,
} from "./review.events";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ArgumentUpdated, DebateTitleUpdated } from "../debates/debate.events";
import {
  NOTIFICATION_JOB,
  NOTIFICATION_QUEUE,
  NotificationEvents,
  NotificationJobPayload,
} from "@decentdebates/shared-types";
import { shouldEmitRoutineLogs } from "src/logging";

const PORT = 3002;

@WebSocketGateway(PORT, {
  namespace: "review",
  cors: { origin: config.CLIENT_URL, credentials: true },
  cookie: true,
})
export class ReviewGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ReviewGateway.name);

  @WebSocketServer()
  server: SocketIOServer;

  constructor(
    private reviewService: ReviewService,
    private commentService: CommentService,
    private debatesService: DebatesService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationsQueue: Queue,
  ) {}

  afterInit(_server: any) {
    if (shouldEmitRoutineLogs()) {
      this.logger.log(`Websocket server up & running on port ${PORT}.`);
    }
  }

  async handleConnection(socket: Socket, ..._args: any[]) {
    try {
      const user = await this.reviewService.getUserFromSocket(socket);
      this.addUserToRoom(socket, user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(errorMessage);
      socket.emit("error", { reason: errorMessage });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    try {
      this.removeUserFromRoom(socket);
    } catch (err) {
      this.logger.error(err instanceof Error ? err.message : String(err));
    }
  }

  @SubscribeMessage("comment/debate:create")
  async handleDebateCommentCreate(
    socket: Socket,
    payload: DebateCommentPayload,
  ): Promise<WsResponse> {
    try {
      const content = payload.comment;
      if (!content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = socket.data.user as UserCookieData;
      const ticketId = +this.getTicketIdFromSocket(socket);

      const commentData: AddCommentData = {
        ticketId,
        content,
        commenterId: user.id,
      };

      const insertedComment =
        await this.commentService.addCommentToDebate(commentData);

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket
        .to(roomIdentifier)
        .emit("comment/debate:create", { insertedComment });

      const debateCommentEv = new DebateReviewNewComment(
        ticketId,
        insertedComment.commentId,
        user,
        payload.debateTitle,
        user.id === +payload.userId ? +payload.assignedToId : +payload.userId,
      );
      debateCommentEv
        .getContent()
        .then((content) =>
          this.notificationsQueue.add(NOTIFICATION_JOB, {
            kind: "ticket-participant",
            title: debateCommentEv.getTitle(),
            content,
            notificationEvent: NotificationEvents.DEBATE,
            recipientId: debateCommentEv.recipientId,
          } satisfies NotificationJobPayload),
        )
        .catch(() => {});

      return {
        event: "comment/debate:create",
        data: { insertedComment },
      };
    } catch (err) {
      this.removeUserFromRoom(
        socket,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  @SubscribeMessage("comment/debate:update")
  async handleDebateCommentUpdate(
    socket: Socket,
    payload: UpdateCommentData,
  ): Promise<string> {
    try {
      if (!payload.content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = socket.data.user as UserCookieData;

      const result = await this.commentService.updateComment(user, payload);
      if (!result.rowCount) {
        throw new WsException("No updates occurred");
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket
        .to(roomIdentifier)
        .emit("comment/debate:update", { updatedComment: payload });

      return "OK";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(errorMessage);
      this.removeUserFromRoom(socket, errorMessage);
    }
  }

  @SubscribeMessage("comment/argument:create")
  async handleArgumentCommentCreate(
    socket: Socket,
    payload: ArgumentCommentPayload,
  ): Promise<WsResponse> {
    try {
      const content = payload.comment;
      if (!content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = socket.data.user as UserCookieData;
      const ticketId = +this.getTicketIdFromSocket(socket);

      const commentData: AddCommentData = {
        ticketId,
        content,
        commenterId: user.id,
      };

      const insertedComment =
        await this.commentService.addCommentToArgument(commentData);

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket
        .to(roomIdentifier)
        .emit("comment/argument:create", { insertedComment });

      const argCommentEv = new ArgumentReviewNewComment(
        ticketId,
        insertedComment.commentId,
        user,
        payload.debateTitle,
        payload.argumentTitle,
        user.id === +payload.userId ? +payload.assignedToId : +payload.userId,
      );
      argCommentEv
        .getContent()
        .then((content) =>
          this.notificationsQueue.add(NOTIFICATION_JOB, {
            kind: "ticket-participant",
            title: argCommentEv.getTitle(),
            content,
            notificationEvent: NotificationEvents.ARGUMENT,
            recipientId: argCommentEv.recipientId,
          } satisfies NotificationJobPayload),
        )
        .catch(() => {});

      return {
        event: "comment/argument:create",
        data: { insertedComment },
      };
    } catch (err) {
      this.removeUserFromRoom(
        socket,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  @SubscribeMessage("comment/argument:update")
  async handleArgumentCommentUpdate(
    socket: Socket,
    payload: UpdateCommentData,
  ): Promise<string> {
    try {
      if (!payload.content) {
        throw new WsException(`Comment's content can't be empty.`);
      }
      const user = socket.data.user as UserCookieData;

      const result = await this.commentService.updateComment(user, payload);
      if (!result.rowCount) {
        throw new WsException("No updates occurred");
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket
        .to(roomIdentifier)
        .emit("comment/argument:update", { updatedComment: payload });

      return "OK";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(errorMessage);
      this.removeUserFromRoom(socket, errorMessage);
    }
  }

  @SubscribeMessage("argument:update")
  async handleArgumentUpdate(
    socket: Socket,
    payload: ArgumentReviewUpdated,
  ): Promise<string> {
    try {
      if (!payload.data) {
        throw new WsException(`Argument data is missing.`);
      }
      const user = socket.data.user as UserCookieData;
      if (user.role !== UserRoles.USER) {
        throw new WsException("Only users can updated their own comment.");
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
        throw new WsException("No updates occurred");
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit("argument:update", payload.data);

      const argUpdatedEv = new ArgumentUpdated(
        payload.ticketId,
        user,
        payload.debateTitle,
        payload.argumentTitle,
        user.id === +payload.userId ? +payload.assignedToId : +payload.userId,
      );
      argUpdatedEv
        .getContent()
        .then((content) =>
          this.notificationsQueue.add(NOTIFICATION_JOB, {
            kind: "ticket-participant",
            title: argUpdatedEv.getTitle(),
            content,
            notificationEvent: NotificationEvents.ARGUMENT,
            recipientId: argUpdatedEv.recipientId,
          } satisfies NotificationJobPayload),
        )
        .catch(() => {});

      return "OK";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(errorMessage);
      this.removeUserFromRoom(socket, errorMessage);
    }
  }

  @SubscribeMessage("debate:update")
  async handleDebateUpdate(
    socket: Socket,
    payload: DebateReviewUpdated,
  ): Promise<string> {
    try {
      if (!payload.data) {
        throw new WsException(`Debate data is missing.`);
      }
      const user = socket.data.user as UserCookieData;
      if (user.role !== UserRoles.USER) {
        throw new WsException("Only users can updated their own debate.");
      }

      const debateData: UpdateDebateData = {
        debateId: payload.data.debateId.toString(),
        title: payload.data.title,
        user,
      };
      const result = await this.debatesService.updateDebate(debateData);
      if (!result.rowCount) {
        throw new WsException("No updates occurred");
      }

      const roomIdentifier = this.getRoomIdentifier(socket);
      socket.to(roomIdentifier).emit("debate:update", payload.data);

      const debateUpdatedEv = new DebateTitleUpdated(
        payload.ticketId,
        user,
        payload.oldTitle,
        payload.data.title,
        user.id === +payload.userId ? +payload.assignedToId : +payload.userId,
      );
      debateUpdatedEv
        .getContent()
        .then((content) =>
          this.notificationsQueue.add(NOTIFICATION_JOB, {
            kind: "ticket-participant",
            title: debateUpdatedEv.getTitle(),
            content,
            notificationEvent: NotificationEvents.DEBATE,
            recipientId: debateUpdatedEv.recipientId,
          } satisfies NotificationJobPayload),
        )
        .catch(() => {});

      return "OK";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(errorMessage);
      this.removeUserFromRoom(socket, errorMessage);
    }
  }

  private addUserToRoom(socket: Socket, user: UserCookieData) {
    socket.data.user = user;

    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.join(roomIdentifier);
  }

  private removeUserFromRoom(socket: Socket, errorMessage = null) {
    const roomIdentifier = this.getRoomIdentifier(socket);
    socket.leave(roomIdentifier);

    if (errorMessage) {
      socket.emit("error", { reason: errorMessage });
    }
  }

  private getRoomIdentifier(socket: Socket) {
    const ticketId = this.getTicketIdFromSocket(socket);
    return `review:${ticketId}`;
  }

  private getTicketIdFromSocket(socket: Socket) {
    const { ticketId } = socket.handshake.query;
    if (!ticketId || ticketId === "undefined") {
      throw new WsException(`'ticketId' is missing.`);
    }

    return ticketId;
  }
}
