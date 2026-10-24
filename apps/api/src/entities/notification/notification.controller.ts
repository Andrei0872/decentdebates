import { ApiTags } from "@nestjs/swagger";
import { shouldEmitRoutineLogs } from "src/logging";
import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  MessageEvent,
  Req,
  Res,
  Sse,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  concat,
  defer,
  filter,
  finalize,
  forkJoin,
  from,
  map,
  Observable,
  takeUntil,
} from "rxjs";
import { fromEventPattern } from "rxjs";
import { metrics, type UpDownCounter } from "@opentelemetry/api";
import { NotificationMessage } from "@decentdebates/shared-types";
import { UserCookieData, UserRoles } from "../user/user.model";
import { NotificationService } from "./notification.service";
import { NOTIFICATION_COUNT_SSE_PATH } from "./notification.paths";

@ApiTags("notification")
@Controller("notification")
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  private readonly sseConnections: UpDownCounter;

  constructor(private notificationService: NotificationService) {
    this.sseConnections = metrics
      .getMeter("@decentdebates/api")
      .createUpDownCounter("app.sse.active_connections", {
        description: "Open SSE streams",
        unit: "{connection}",
      });
  }

  @Get()
  async getNotifications(@Res() res: Response, @Req() req: Request) {
    const user = (req as any).session.user as UserCookieData;

    return forkJoin({
      notifications: this.notificationService.getAll(user),
    }).pipe(
      map((r) => {
        const unreadNotifIds = r.notifications
          .filter((n) => n.isRead === false)
          .map((n) => n.id);
        if (unreadNotifIds.length) {
          this.notificationService
            .markNotificationsAsRead(unreadNotifIds)
            .catch((err) =>
              this.logger.error(
                err instanceof Error ? err.message : String(err),
              ),
            );
        }
        return res.status(HttpStatus.OK).json(r);
      }),
    );
  }

  @Sse("/count")
  notificationCount(@Req() req: Request): Observable<MessageEvent> {
    const user = (req as any).session.user as UserCookieData;

    const clientDisconnected$ = fromEventPattern(
      (handler) => req.on("close", handler),
      (handler) => req.off("close", handler),
    );

    const attributes = { "http.route": NOTIFICATION_COUNT_SSE_PATH };

    return defer(() => {
      this.sseConnections.add(1, attributes);
      return concat(
        from(this.notificationService.getUnreadCount(user)).pipe(
          map((count) => ({ data: { unreadCount: +count } })),
        ),
        this.notificationService.notifications$.pipe(
          filter((msg: NotificationMessage) =>
            msg.kind === "generic-moderator"
              ? user.role === UserRoles.MODERATOR
              : msg.recipientId === user.id,
          ),
          map(() => ({ data: { unreadCount: 1 } })),
        ),
      );
    }).pipe(
      finalize(() => {
        this.sseConnections.add(-1, attributes);
        if (shouldEmitRoutineLogs()) {
          this.logger.debug("Notification count SSE stream closed.");
        }
      }),
      takeUntil(clientDisconnected$),
    );
  }
}
