import { Controller, Get, HttpException, HttpStatus, MessageEvent, Query, Req, Res, Sse } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { catchError, concat, filter, finalize, forkJoin, from, fromEventPattern, map, mapTo, merge, NEVER, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { ArgumentTicketCreated, ArgumentUpdated, DebateTicketApproved, DebateTicketCreated, DebateTitleUpdated } from '../debates/debate.events';
import { ArgumentReviewNewComment, DebateReviewNewComment } from '../review/review.events';
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

    const clientDisconnected$ = fromEventPattern(
      handler => req.on('close', handler),
      handler => req.off('close', handler),
    );

    return concat(
      from(this.notificationService.getUnreadCount(user))
        .pipe(
          map(count => ({ data: { unreadCount: +count } }))
        ),
      merge(
        ...this.getListenersBasedOnUserRole(user)
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

  private getListenersBasedOnUserRole(user: UserCookieData): Array<Observable<any>> {
    switch (user.role) {
      case UserRoles.MODERATOR: {
        const debateTicketCreated$ = fromEventPattern<DebateTicketCreated>(
          handler => this.eventEmitter.on(DebateTicketCreated.EVENT_NAME, handler),
          handler => this.eventEmitter.off(DebateTicketCreated.EVENT_NAME, handler),
        );

        const argumentTicketCreated$ = fromEventPattern<ArgumentTicketCreated>(
          handler => this.eventEmitter.on(ArgumentTicketCreated.EVENT_NAME, handler),
          handler => this.eventEmitter.off(ArgumentTicketCreated.EVENT_NAME, handler),
        );

        const debateReviewNewComment$ = fromEventPattern<DebateReviewNewComment>(
          handler => this.eventEmitter.on(DebateReviewNewComment.EVENT_NAME, handler),
          handler => this.eventEmitter.off(DebateReviewNewComment.EVENT_NAME, handler),
        ).pipe(
          // A moderator receives a notification only from a user.
          filter(ev => {
            return ev.user.role === UserRoles.USER && ev.recipientId === user.id
          })
        );

        const argumentReviewNewComment$ = fromEventPattern<ArgumentReviewNewComment>(
          handler => this.eventEmitter.on(ArgumentReviewNewComment.EVENT_NAME, handler),
          handler => this.eventEmitter.off(ArgumentReviewNewComment.EVENT_NAME, handler),
        ).pipe(
          filter(ev => {
            return ev.user.role === UserRoles.USER && ev.recipientId === user.id
          })
        );

        const debateReviewUpdated$ = fromEventPattern<DebateTitleUpdated>(
          handler => this.eventEmitter.on(DebateTitleUpdated.EVENT_NAME, handler),
          handler => this.eventEmitter.off(DebateTitleUpdated.EVENT_NAME, handler),
        ).pipe(
          filter(ev => {
            return ev.user.role === UserRoles.USER && ev.recipientId === user.id;
          })
        );

        const argumentReviewUpdated$ = fromEventPattern<ArgumentUpdated>(
          handler => this.eventEmitter.on(ArgumentUpdated.EVENT_NAME, handler),
          handler => this.eventEmitter.off(ArgumentUpdated.EVENT_NAME, handler),
        ).pipe(
          filter(ev => {
            return ev.user.role === UserRoles.USER && ev.recipientId === user.id;
          })
        );

        return [
          debateTicketCreated$,
          argumentTicketCreated$,
          debateReviewNewComment$,
          argumentReviewNewComment$,
          debateReviewUpdated$,
          argumentReviewUpdated$,
        ];
      }

      case UserRoles.USER: {
        const debateReviewNewComment$ = fromEventPattern<DebateReviewNewComment>(
          handler => this.eventEmitter.on(DebateReviewNewComment.EVENT_NAME, handler),
          handler => this.eventEmitter.off(DebateReviewNewComment.EVENT_NAME, handler),
        ).pipe(
          // A user receives a notification only from a moderator.
          filter(ev => {
            return ev.user.role === UserRoles.MODERATOR && ev.recipientId === user.id;
          })
        );

        const argumentReviewNewComment$ = fromEventPattern<ArgumentReviewNewComment>(
          handler => this.eventEmitter.on(ArgumentReviewNewComment.EVENT_NAME, handler),
          handler => this.eventEmitter.off(ArgumentReviewNewComment.EVENT_NAME, handler),
        ).pipe(
          // A user receives a notification only from a moderator.
          filter(ev => {
            return ev.user.role === UserRoles.MODERATOR && ev.recipientId === user.id;
          })
        );

        const debateTicketApproved$ = fromEventPattern<DebateTicketApproved>(
          handler => this.eventEmitter.on(DebateTicketApproved.EVENT_NAME, handler),
          handler => this.eventEmitter.off(DebateTicketApproved.EVENT_NAME, handler),
        ).pipe(
          filter(ev => ev.recipientId === user.id)
        );

        return [
          debateReviewNewComment$,
          argumentReviewNewComment$,
          debateTicketApproved$,
        ];
      }

      default: {
        return [NEVER]
      }
    }
  }
}
