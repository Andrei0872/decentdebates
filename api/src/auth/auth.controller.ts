import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, SetMetadata} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from '../entities/user/dtos/register-user.dto';
import { LoginUserDTO } from 'src/entities/user/dtos/login-user.dto';
import { getPublicUser } from 'src/entities/user/user.model';

@SetMetadata('skipAuth', true)
@Controller('auth')
export class AuthController {
  constructor (private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerUserDTO: RegisterUserDTO, @Res() res: Response, @Req() req: Request) {
    try {
      const user = await this.authService.register(registerUserDTO);

      (req as any).session.user = this.authService.getUserCookieFields(user);
      
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
  async login (@Body() loginUserDTO: LoginUserDTO, @Res() res: Response, @Req() req: Request) {
    try {
      const user = await this.authService.login(loginUserDTO);

      (req as any).session.user = this.authService.getUserCookieFields(user);

      return res
        .status(HttpStatus.CREATED)
        .json({
          data: getPublicUser(user),
        })
    } catch (err) {
      throw new HttpException(err.message, 400);
    }
  }
}
