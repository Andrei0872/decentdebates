import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { from, map, catchError, tap } from 'rxjs';
import { UserCookieData } from '../user/user.model';
import { UpdateCommentData } from './comment.model';
import { CommentService } from './comment.service';
import { UpdateCommentDTO } from './dtos/update-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) { }

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

  @Patch('/:commentId')
  async updateComment(@Req() req: Request, @Res() res: Response, @Param('commentId') commentId: string, @Body() updateCommentDTO: UpdateCommentDTO) {
    const user = (req as any).session.user as UserCookieData;

    const updateCommentData: UpdateCommentData = {
      commentId: +commentId,
      content: updateCommentDTO.content,
    };

    return from(this.commentService.updateComment(user, updateCommentData))
      .pipe(
        tap(r => {
          if (!r.rowCount) {
            if (!r.rowCount) {
              throw new Error('No updates occurred');
            }
          }
        }),
        map((comments) => res.status(HttpStatus.OK).json({ message: 'Comment successfully updated.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
