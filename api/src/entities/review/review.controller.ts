import { Controller, Get, HttpException, HttpStatus, Param, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, from, map } from 'rxjs';
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
        map((comments) => res.status(HttpStatus.OK).json({ data: comments })),
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
        map(debate => res.status(HttpStatus.OK).json({ debate })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
