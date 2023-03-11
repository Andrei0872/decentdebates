import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { from, map, catchError, mergeAll, defer, of, forkJoin } from 'rxjs';
import { EntityNotFoundError } from 'src/errors/EntityNotFoundError';
import { DebatesQueryPipe } from 'src/pipes/debates-query.pipe';
import { isNumber } from 'src/utils';
import { getDebates } from 'src/utils/debates';
import { UserCookieData } from '../user/user.model';
import { CreateArgumentData, GetDraftData } from './debates.model';
import { DebatesService, Filters } from './debates.service';
import { CreateArgumentDTO } from './dtos/create-argument.dto';
import { CreateDebateDTO } from './dtos/create-debate.dto';

@Controller('debates')
export class DebatesController {
  constructor(private debatesService: DebatesService) { }

  @SetMetadata('skipAuth', true)
  @Get('/')
  async getAll(@Res() res: Response, @Query('q', new DebatesQueryPipe()) filters: Filters) {
    try {
      const debates = await this.debatesService.getAll(filters);
      return res.json({
        data: debates,
      });
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }

  @Post('/')
  async createDebate(@Res() res: Response, @Req() req: Request, @Body() body: CreateDebateDTO) {
    const user = (req as any).session.user as UserCookieData;

    try {
      await this.debatesService.createDebate(user, body);
      return res
        .status(HttpStatus.CREATED)
        .json({ message: 'Debate successfully proposed.' })
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }

  @SetMetadata('skipAuth', true)
  @Get('/:id')
  async getDebate(@Res() res: Response, @Param('id') debateId: string) {
    return getDebates(this.debatesService.getDebateArguments(debateId))
      .pipe(
        map((data) => res.status(HttpStatus.OK).json({ data: data })),
        catchError((err) => {
          throw new HttpException(err.message, err.status || HttpStatus.BAD_REQUEST);
        })
      )
  }

  @SetMetadata('skipAuth', true)
  @Get('/:debateId/argument/:argumentId')
  async getDebateArgument(@Res() res: Response, @Param('debateId') debateId: string, @Param('argumentId') argumentId: string) {
    return from(this.debatesService.getDebateArgument(debateId, argumentId))
      .pipe(
        mergeAll(),
        map((arg) => res.status(HttpStatus.OK).json({ data: arg })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }


  @Post('/:debateId/argument')
  async createArgument(@Res() res: Response, @Req() req: Request, @Body() body: CreateArgumentDTO) {
    const user = (req as any).session.user as UserCookieData;
    const { debateId } = req.params;

    const argData: CreateArgumentData = {
      user,
      debateId: +debateId,
      argumentDetails: body,
    };

    return from(this.debatesService.createArgument(argData))
      .pipe(
        map((arg) => res.status(HttpStatus.CREATED).json({ message: 'The argument has been successfully created.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Post('/:debateId/draft')
  async saveArgumentAsDraft(@Res() res: Response, @Req() req: Request, @Body() body: CreateArgumentDTO) {
    const user = (req as any).session.user as UserCookieData;
    const { debateId } = req.params;

    if (!isNumber(debateId)) {
      throw new HttpException(`'debateId' is expected to be a number.`, HttpStatus.BAD_REQUEST);
    }

    const argData: CreateArgumentData = {
      user,
      debateId: +debateId,
      argumentDetails: body,
    };

    return from(this.debatesService.saveArgumentAsDraft(argData))
      .pipe(
        map((arg) => res.status(HttpStatus.CREATED).json({ message: 'Draft successfully saved.' })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }

  @Get('/:debateId/draft/:draftId')
  async getDraft(@Res() res: Response, @Req() req: Request) {
    const user = (req as any).session.user as UserCookieData;
    const { debateId, draftId } = req.params;
    const { includeDebate } = req.query;

    // TODO: use filters for such cases.
    if (!isNumber(debateId)) {
      throw new HttpException(`'debateId' is expected to be a number.`, HttpStatus.BAD_REQUEST);
    }

    if (!isNumber(draftId)) {
      throw new HttpException(`'draftId' is expected to be a number.`, HttpStatus.BAD_REQUEST);
    }

    const draftData: GetDraftData = {
      user,
      debateId: +debateId,
      argumentId: +draftId,
    };
    const getDraft$ = defer(() => this.debatesService.getDraft(draftData));

    const shouldIncludeDebate = !!includeDebate && includeDebate === 'true';
    const getDebate$ = defer(() => shouldIncludeDebate ? getDebates(this.debatesService.getDebateArguments(debateId)) : of(null));

    return forkJoin({ draft: getDraft$, debate: getDebate$ })
      .pipe(
        map(data => res.status(HttpStatus.CREATED).json({ data })),
        catchError((err) => {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        })
      )
  }
}