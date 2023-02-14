import { Body, Controller, Get, HttpException, HttpStatus, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from '../user/dtos/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor (private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDTO: RegisterUserDTO, @Res() res: Response) {
    try {
      await this.authService.register(registerUserDTO);
      return res
        .status(HttpStatus.CREATED)
        .json({
          message: 'User successfully registered.'
        });
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }

  @Post('login')
  login () {}

  @Get('test')
  test () {
    return 'Hello!!'
  }
}
