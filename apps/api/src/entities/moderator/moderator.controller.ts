import { ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { EntityNotFoundError } from "src/errors/EntityNotFoundError";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { enqueueNotification } from "src/entities/notification/notification-queue";
import { Request, Response } from "express";
import {
  filter,
  forkJoin,
  from,
  groupBy,
  map,
  mergeAll,
  mergeMap,
  reduce,
  tap,
} from "rxjs";
import { Roles } from "src/decorators/roles.decorator";
import { RolesGuard } from "src/guards/roles.guard";
import {
  ArgumentTicketApproved,
  DebateTicketApproved,
} from "../debates/debate.events";
import { DebatesService } from "../debates/debates.service";
import { UserCookieData, UserRoles } from "../user/user.model";
import { ApproveArgumentDTO } from "./dtos/approve-argument.dto";
import { ApproveDebateDTO } from "./dtos/approve-debate.dto";
import { UpdateTicketDTO } from "./dtos/update-ticket.dto";
import { UpdateTicketData } from "./moderator.model";
import { ModeratorService } from "./moderator.service";
import { REDIS_CACHE_CLIENT_TOKEN } from "src/redis/redis.module";
import { type RedisClientType } from "redis";
import {
  NOTIFICATION_QUEUE,
  NotificationEvents,
} from "@decentdebates/shared-types";

@ApiTags("moderator")
@Controller("moderator")
@UseGuards(RolesGuard)
@Roles(UserRoles.MODERATOR)
export class ModeratorController {
  constructor(
    private moderatorService: ModeratorService,
    private debatesService: DebatesService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationsQueue: Queue,
    @Inject(REDIS_CACHE_CLIENT_TOKEN) private cache: RedisClientType,
  ) {}

  @Get("/activity")
  getActivity(@Res() res: Response) {
    return forkJoin([
      from(this.moderatorService.getDebateCards()).pipe(
        map((debates) =>
          debates.map((rawDebate) => {
            // When a board list is empty.
            if (!rawDebate.ticketId) {
              return rawDebate;
            }

            const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

            const tags = rawTags.split(",");
            const tagsIds = rawTagsIds.split(",");

            return {
              ...debate,
              tags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
            };
          }),
        ),
      ),
      this.moderatorService.getArgumentCards(),
    ]).pipe(
      mergeAll(),
      mergeAll(),
      groupBy((r) => r.boardList, { element: (cardData) => cardData }),
      mergeMap((grp$) =>
        grp$.pipe(
          filter((card) => card.ticketId !== null),
          reduce((acc, crt) => [...acc, crt], []),
          map((cards) => ({ boardList: grp$.key, cards })),
        ),
      ),
      reduce((acc, crt) => [...acc, crt], []),
      map((r) => res.status(HttpStatus.OK).json({ data: r })),
    );
  }

  @Patch("/activity/ticket/:id")
  updateTicket(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: UpdateTicketDTO,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    const ticket: UpdateTicketData = {
      userId: user.id,
      ticketId: id,
      ticketData: body,
    };

    return from(this.moderatorService.updateTicket(ticket)).pipe(
      map(() => res.status(HttpStatus.NO_CONTENT).end()),
    );
  }

  @Get("debates/:debateId/argument/:argumentId")
  async getDebateArgument(
    @Res() res: Response,
    @Param("debateId", ParseIntPipe) debateId: number,
    @Param("argumentId", ParseIntPipe) argumentId: number,
  ) {
    return from(
      this.debatesService.getDebateArgumentAsModerator(debateId, argumentId),
    ).pipe(
      map(([arg]) => {
        if (!arg) {
          throw new EntityNotFoundError("argument");
        }

        return res.status(HttpStatus.OK).json({ data: arg });
      }),
    );
  }

  @Get("/debate/:ticketId")
  async getDebateByTicketId(
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    return from(this.debatesService.getDebateByTicketId(ticketId)).pipe(
      map((debate) => res.status(HttpStatus.OK).json({ debate })),
    );
  }

  @Patch("/approve/debate/:ticketId")
  async approveDebate(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
    @Body() body: ApproveDebateDTO,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.moderatorService.approveTicket(user, ticketId)).pipe(
      tap((res) => {
        if (!res.rowCount) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      tap({
        next: (res) => {
          const {
            rows: [{ created_by: recipientId }],
          } = res;

          const debateApprovedEv = new DebateTicketApproved(
            +ticketId,
            body.debateId,
            body.debateTitle,
            recipientId,
            user.id,
          );
          debateApprovedEv
            .getContent()
            .then((content) =>
              enqueueNotification(this.notificationsQueue, {
                kind: "ticket-participant",
                title: debateApprovedEv.getTitle(),
                content,
                notificationEvent: NotificationEvents.DEBATE,
                recipientId,
              }),
            )
            .catch(() => {});
        },
      }),
      map(() =>
        res
          .status(HttpStatus.OK)
          .json({ message: "The debate has been approved." }),
      ),
    );
  }

  @Patch("/approve/argument/:ticketId")
  async approveArgument(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
    @Body() body: ApproveArgumentDTO,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.moderatorService.approveTicket(user, ticketId)).pipe(
      tap((res) => {
        if (!res.rowCount) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      tap({
        next: (res) => {
          const {
            rows: [{ created_by: recipientId }],
          } = res;

          this.cache.del(`cache:debates:${body.debateId}`).catch(() => {});

          const argApprovedEv = new ArgumentTicketApproved(
            +ticketId,
            body.debateId,
            body.debateTitle,
            body.argumentId,
            body.argumentTitle,
            recipientId,
            user.id,
          );
          argApprovedEv
            .getContent()
            .then((content) =>
              enqueueNotification(this.notificationsQueue, {
                kind: "ticket-participant",
                title: argApprovedEv.getTitle(),
                content,
                notificationEvent: NotificationEvents.ARGUMENT,
                recipientId,
              }),
            )
            .catch(() => {});
        },
      }),
      map(() =>
        res
          .status(HttpStatus.OK)
          .json({ message: "The argument has been approved." }),
      ),
    );
  }
}
