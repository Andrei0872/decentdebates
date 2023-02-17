import { Controller, Get, HttpException, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DebatesService } from './debates.service';

@Controller('debates')
export class DebatesController {
  constructor (private debatesService: DebatesService) { }

  @Get('/')
  async getAll(@Res() res: Response, @Query('q') encodedQuery: string) {
    let filters = null;
    if (encodedQuery) {
      const decodedQuery = Buffer.from(encodedQuery, 'base64').toString();
      filters = JSON.parse(decodedQuery);
    }

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