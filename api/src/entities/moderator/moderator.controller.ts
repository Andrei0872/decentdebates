import { Controller, Get, HttpException, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserRoles } from '../user/user.model';
import { ModeratorService } from './moderator.service';

@Controller('moderator')
@UseGuards(RolesGuard)
@Roles(UserRoles.MODERATOR)
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
