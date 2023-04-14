import { Controller, Get, HttpException, HttpStatus, MessageEvent, Query, Req, Res, Sse } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { catchError, concat, forkJoin, from, map, Observable, Subject, tap } from 'rxjs';
import { UserCookieData } from '../user/user.model';
import { NotificationsReadEvent } from './notification.events';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter2
  ) { }

  @Get()
  async getNotifications(@Res() res: Response, @Req() req: Request) {
    const user = (req as any).session.user as UserCookieData;

    return forkJoin({
      notifications: this.notificationService.getAll(user),
    })
      .pipe(
        tap(r => {
          const unreadNotifIds = r.notifications
            .filter(n => n.isRead === false)
            .map(n => n.id);
          if (!unreadNotifIds.length) {
            return;
          }

          this.eventEmitter.emitAsync(
            'notifications.read',
            new NotificationsReadEvent(unreadNotifIds)
          );
        }),
        map(r => res.status(HttpStatus.OK).json(r)),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Sse('/count')
  notificationCount(@Req() req: Request): Observable<MessageEvent> {
    const user = (req as any).session.user as UserCookieData;

    const notifSource = new Subject<MessageEvent>();

    return concat(
      from(this.notificationService.getUnreadCount(user))
        .pipe(
          map(count => ({ data: { unreadCount: +count } }))
        ),
      notifSource
    );
  }

}
