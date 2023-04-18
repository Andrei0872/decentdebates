import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { catchError, filter, forkJoin, from, groupBy, map, mergeAll, mergeMap, reduce, tap, throwError } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { ArgumentTicketApproved, DebateTicketApproved } from '../debates/debate.events';
import { DebatesService } from '../debates/debates.service';
import { UserCookieData, UserRoles } from '../user/user.model';
import { ApproveArgumentDTO } from './dtos/approve-argument.dto';
import { ApproveDebateDTO } from './dtos/approve-debate.dto';
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
    private eventEmitter: EventEmitter2,
  ) { }

  @Get('/activity')
  getActivity(@Res() res: Response) {
    return forkJoin([
      from(this.moderatorService.getDebateCards())
        .pipe(
          map(debates => debates.map(rawDebate => {
            // When a board list is empty.
            if (!rawDebate.ticketId) {
              return rawDebate;
            }

            const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

            const tags = rawTags.split(',');
            const tagsIds = rawTagsIds.split(',');

            return {
              ...debate,
              tags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
            };
          }))
        ),
      this.moderatorService.getArgumentCards()
    ])
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

  @Patch('/approve/debate/:ticketId')
  async approveDebate(
    @Req() req: Request,
    @Res() res: Response,
    @Param('ticketId') ticketId: string,
    @Body() body: ApproveDebateDTO,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.moderatorService.approveTicket(user, ticketId))
      .pipe(
        tap(res => {
          if (!res.rowCount) {
            throw new Error('Wrong attempt to update the debate.');
          }
        }),
        tap({
          next: (res) => {
            const { rows: [{ created_by: recipientId }] } = res;
            
            this.eventEmitter.emitAsync(
              DebateTicketApproved.EVENT_NAME,
              new DebateTicketApproved(
                +ticketId,
                body.debateId,
                body.debateTitle,
                recipientId,
                user.id,
              ),
            );
          },
        }),
        map(() => res.status(HttpStatus.OK).json({ message: 'The debate has been approved.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Patch('/approve/argument/:ticketId')
  async approveArgument(
    @Req() req: Request,
    @Res() res: Response,
    @Param('ticketId') ticketId: string,
    @Body() body: ApproveArgumentDTO,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.moderatorService.approveTicket(user, ticketId))
      .pipe(
        tap(res => {
          if (!res.rowCount) {
            throw new Error('Wrong attempt to update the argument.');
          }
        }),
        tap({
          next: (res) => {
            const { rows: [{ created_by: recipientId }] } = res;
            
            this.eventEmitter.emitAsync(
              ArgumentTicketApproved.EVENT_NAME,
              new ArgumentTicketApproved(
                +ticketId,
                body.debateId,
                body.debateTitle,
                body.argumentId,
                body.argumentTitle,
                recipientId,
                user.id,
              ),
            );
          },
        }),
        map(() => res.status(HttpStatus.OK).json({ message: 'The argument has been approved.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}
