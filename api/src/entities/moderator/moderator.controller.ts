import { Controller, Get, HttpException, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { catchError, filter, from, groupBy, map, mergeAll, mergeMap, reduce, throwError } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserRoles } from '../user/user.model';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
@UseGuards(RolesGuard)
@Roles(UserRoles.MODERATOR)
export class ModeratorController {
  constructor(private moderatorService: ModeratorService) { }

  @Get('/activity')
  getActivity(@Res() res: Response) {
    return from(this.moderatorService.getActivity())
      .pipe(
        mergeAll(),
        groupBy(r => r.boardList, { element: ({ boardList, ...cardData }) => cardData }),
        mergeMap(
          grp$ => grp$.pipe(
            filter(card => card.ticketId !== null),
            reduce((acc, crt) => [...acc, crt], []),
            map(cards => ({ boardList: grp$.key, cards }))
          )
        ),
        reduce((acc, crt) => [...acc, crt], []),
        map(r => res.status(HttpStatus.OK).json({ data: r })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
