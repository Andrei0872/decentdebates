import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { DebatesQueryPipe } from 'src/pipes/debates-query.pipe';
import { UserCookieData } from '../user/user.model';
import { DebatesService, Filters } from './debates.service';
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
  async createDebate (@Res() res: Response, @Req() req: Request, @Body() body: CreateDebateDTO) {
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
}