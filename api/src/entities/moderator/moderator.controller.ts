import { Controller, Get, HttpException, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
export class ModeratorController {
  constructor (private moderatorService: ModeratorService) { }

  @Get('/activity')
  async getActivity (@Res() res: Response) {
    try {
      const activity = await this.moderatorService.getActivity();
      return res
        .status(HttpStatus.OK)
        .json({
          data: activity,
        });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
