import { Body, Controller, Get, HttpException, HttpStatus, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from '../user/dtos/register-user.dto';
import { LoginUserDTO } from 'src/user/dtos/login-user.dto';
import { getPublicUser } from 'src/user/user.model';

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
  async login (@Body() loginUserDTO: LoginUserDTO, @Res() res: Response) {
    try {
      const user = await this.authService.login(loginUserDTO);

      return res
        .status(HttpStatus.CREATED)
        .json({
          data: getPublicUser(user),
        })
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }

  @Get('test')
  test () {
    return 'Hello!!'
  }
}
