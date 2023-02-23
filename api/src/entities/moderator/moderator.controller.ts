import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, filter, forkJoin, from, groupBy, map, mergeAll, mergeMap, reduce, throwError } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserCookieData, UserRoles } from '../user/user.model';
import { UpdateTicketDTO } from './dtos/update-ticket.dto';
import { UpdateTicketData } from './moderator.model';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
@UseGuards(RolesGuard)
@Roles(UserRoles.MODERATOR)
export class ModeratorController {
  constructor(private moderatorService: ModeratorService) { }

  @Get('/activity')
  getActivity(@Res() res: Response) {
    return forkJoin([this.moderatorService.getDebateCards(), this.moderatorService.getArgumentCards()])
      .pipe(
        mergeAll(),
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

  @Patch('/activity/ticket/:id')
  updateTicket(@Req() req: Request, @Res() res: Response, @Body() body: UpdateTicketDTO, @Param('id') id: string) {
    const user = (req as any).session.user as UserCookieData;

    const ticket: UpdateTicketData = {
      userId: user.id,
      ticketId: id,
      ticketData: body,
    }

    return from(this.moderatorService.updateTicket(ticket))
      .pipe(
        map(() => res.status(HttpStatus.NO_CONTENT).end()),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
