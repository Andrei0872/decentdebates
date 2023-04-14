import { Controller, Get, HttpException, HttpStatus, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, forkJoin, from, map } from 'rxjs';
import { UserCookieData } from '../user/user.model';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) { }

  @Get()
  async getNotifications(@Res() res: Response, @Req() req: Request, @Query('include_unread_count') includeUnreadCountRaw?: string) {
    const user = (req as any).session.user as UserCookieData;

    const includeUnreadCount = includeUnreadCountRaw === 'true';
    return forkJoin({
      notifications: this.notificationService.getAll(user),
      ...includeUnreadCount && { unreadCount: this.notificationService.getUnreadCount(user) }
    })
      .pipe(
        map(r => res.status(HttpStatus.OK).json(r)),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
