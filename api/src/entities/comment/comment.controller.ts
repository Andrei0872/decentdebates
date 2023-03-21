import { Controller, Get, HttpException, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { from, map, catchError } from 'rxjs';
import { UserCookieData } from '../user/user.model';
import { CommentService } from './comment.service';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}
  
  @Get('/:ticketId')
  async getTicketComments(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.commentService.getTicketComments(ticketId, user))
      .pipe(
        map((comments) => res.status(HttpStatus.OK).json({ data: comments })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
