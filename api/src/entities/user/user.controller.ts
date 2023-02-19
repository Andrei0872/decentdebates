import { Controller, Get, HttpException, HttpStatus, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserCookieData } from './user.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor (private userService: UserService) {

  }
  
  @Get('/ongoing-items')
  async getOngoingItems (@Req() req: Request, @Res() res: Response) {
    const user = (req as any).session.user as UserCookieData;

    try {
      const data = await this.userService.getOngoingItems(user);
      return res
        .status(HttpStatus.OK)
        .json({
          data,
        });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
