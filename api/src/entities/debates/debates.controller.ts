import { Controller, Get, HttpException, Res } from '@nestjs/common';
import { Response } from 'express';
import { DebatesService } from './debates.service';

@Controller('debates')
export class DebatesController {
  constructor (private debatesService: DebatesService) { }

  @Get('/')
  async getAll(@Res() res: Response) {
    try {
      const debates = await this.debatesService.getAll();
      return res.json({
        data: debates,
      });
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }
}