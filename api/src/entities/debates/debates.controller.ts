import { Controller, Get, HttpException, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DebatesQueryPipe } from 'src/pipes/debates-query.pipe';
import { DebatesService, Filters } from './debates.service';

@Controller('debates')
export class DebatesController {
  constructor(private debatesService: DebatesService) { }

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
}