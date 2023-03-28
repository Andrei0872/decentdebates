import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, filter, forkJoin, from, groupBy, map, mergeAll, mergeMap, reduce, tap, throwError } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { DebatesService } from '../debates/debates.service';
import { UserCookieData, UserRoles } from '../user/user.model';
import { UpdateTicketDTO } from './dtos/update-ticket.dto';
import { UpdateTicketData } from './moderator.model';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
@UseGuards(RolesGuard)
@Roles(UserRoles.MODERATOR)
export class ModeratorController {
  constructor(
    private moderatorService: ModeratorService,
    private debatesService: DebatesService,
  ) { }

  @Get('/activity')
  getActivity(@Res() res: Response) {
    return forkJoin([this.moderatorService.getDebateCards(), this.moderatorService.getArgumentCards()])
      .pipe(
        mergeAll(),
        mergeAll(),
        groupBy(r => r.boardList, { element: cardData => cardData }),
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


  @Get('debates/:debateId/argument/:argumentId')
  async getDebateArgument(@Res() res: Response, @Param('debateId') debateId: string, @Param('argumentId') argumentId: string) {
    return from(this.debatesService.getDebateArgumentAsModerator(debateId, argumentId))
      .pipe(
        mergeAll(),
        map((arg) => res.status(HttpStatus.OK).json({ data: arg })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Get('/debate/:ticketId')
  async getDebateByTicketId(@Res() res: Response, @Param('ticketId') ticketId: string) {
    return from(this.debatesService.getDebateByTicketId(ticketId))
      .pipe(
        map(debate => res.status(HttpStatus.OK).json({ debate })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Patch('/approve/ticket/:ticketId')
  async approveTicket(@Req() req: Request, @Res() res: Response, @Param('ticketId') ticketId: string) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.moderatorService.approveTicket(user, ticketId))
      .pipe(
        tap(res => {
          if (!res.rowCount) {
            throw new Error('Wrong attempt to update the ticket.');
          }
        }),
        map(() => res.status(HttpStatus.OK).json({ message: 'The ticket has been approved.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
