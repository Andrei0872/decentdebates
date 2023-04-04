import { Controller, Get, HttpException, HttpStatus, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, from, map, tap } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserCookieData, UserRoles } from '../user/user.model';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) { }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.MODERATOR)
  @Get('/moderator/argument/:ticketId')
  async getArgumentAsModerator(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.reviewService.getArgumentAsModerator(user, ticketId))
      .pipe(
        tap(data => {
          if (!data) {
            throw new Error('The ticket has no moderator assigned or the moderator is not the one assigned to the ticket.');
          }
        }),
        map(data => res.status(HttpStatus.OK).json({ data })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.MODERATOR)
  @Get('/moderator/debate/:ticketId')
  async getDebateAsModerator(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.reviewService.getDebateAsModerator(user, ticketId))
      .pipe(
        tap(data => {
          if (!data) {
            throw new Error('The ticket has no moderator assigned or the moderator is not the one assigned to the ticket.');
          }
        }),
        map(rawDebate => {
          const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

          const tags = rawTags.split(',');
          const tagsIds = rawTagsIds.split(',');

          return {
            ...debate,
            debateTags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
          };
        }),
        map(debate => res.status(HttpStatus.OK).json({ debate })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.USER)
  @Get('/user/debate/:ticketId')
  async getDebateAsUser(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.reviewService.getDebateAsUser(user, ticketId))
      .pipe(
        tap(data => {
          if (!data) {
            throw new Error('This user is not assigned to this ticket.');
          }
        }),
        map(rawDebate => {
          const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

          const tags = rawTags.split(',');
          const tagsIds = rawTagsIds.split(',');

          return {
            ...debate,
            tags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
          };
        }),
        map(debate => res.status(HttpStatus.OK).json({ debate })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.USER)
  @Get('/user/argument/:ticketId')
  async getArgumentAsUser(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.reviewService.getArgumentAsUser(user, ticketId))
      .pipe(
        tap(data => {
          if (!data) {
            throw new Error('This user is not assigned to this ticket.');
          }
        }),
        map(data => res.status(HttpStatus.OK).json({ data })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
