import { Controller, Get, HttpException, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, filter, forkJoin, groupBy, map, mergeAll, mergeMap, reduce } from 'rxjs';
import { UserCookieData } from './user.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) { }

  @Get('/activity')
  async getActivity(@Res() res: Response, @Req() req: Request) {
    const user = (req as any).session.user as UserCookieData;

    return forkJoin([this.userService.getActivityArguments(user), this.userService.getActivityDebates(user)])
      .pipe(
        mergeAll(),
        mergeAll(),
        reduce((acc, crt) => [...acc, crt], []),
        map(r => res.status(HttpStatus.OK).json({ data: r })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}