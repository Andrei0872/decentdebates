import { Body, Controller, Get, Post, Res} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from '../user/dtos/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor (private authService: AuthService) {}
  
  @Post('register')
  register (@Body() registerUserDTO: RegisterUserDTO, @Res() res: Response) {
    this.authService.register(registerUserDTO);
    return res.json({
      message: '123'
    })
  }

  @Post('login')
  login () {}

  @Get('test')
  test () {
    return 'Hello!!'
  }
}
