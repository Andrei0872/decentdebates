import { Controller, Get, HttpException, HttpStatus, MessageEvent, Query, Req, Res, Sse } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { catchError, concat, filter, finalize, forkJoin, from, fromEventPattern, map, mapTo, merge, Observable, Subject, takeUntil, tap } from 'rxjs';
import { DebateTicketCreated } from '../debates/debate.events';
import { UserCookieData, UserRoles } from '../user/user.model';
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

    let notifSource = new Subject<MessageEvent>();

    const clientDisconnected$ = fromEventPattern(
      handler => req.on('close', handler),
      handler => req.off('close', handler),
    );

    const debateTicketCreated$ = fromEventPattern<MessageEvent>(
      handler => this.eventEmitter.on(DebateTicketCreated.EVENT_NAME, handler),
      handler => this.eventEmitter.off(DebateTicketCreated.EVENT_NAME, handler),
    ).pipe(
      filter(() => user.role === UserRoles.MODERATOR)
    );

    // TODO: provide observables based on user role.

    return concat(
      from(this.notificationService.getUnreadCount(user))
        .pipe(
          map(count => ({ data: { unreadCount: +count } }))
        ),
      merge(
        debateTicketCreated$
      ).pipe(
        map(() => ({ data: { unreadCount: 1 } })),
      )
    ).pipe(
      finalize(() => {
        console.log('fin!');
      }),
      takeUntil(clientDisconnected$)
    )
  }

}
