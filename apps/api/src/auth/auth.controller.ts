import { ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  SetMetadata,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterUserDTO } from "../entities/user/dtos/register-user.dto";
import { LoginUserDTO } from "src/entities/user/dtos/login-user.dto";
import { getPublicUser } from "src/entities/user/user.model";
import { config } from "src/config";

export const AUTH_THROTTLE = { ttl: 60_000, limit: config.AUTH_THROTTLE_LIMIT };

@ApiTags("auth")
@SetMetadata("skipAuth", true)
@Throttle({ default: AUTH_THROTTLE })
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(
    @Body() registerUserDTO: RegisterUserDTO,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const user = await this.authService.register(registerUserDTO);

    (req as any).session.user = this.authService.getUserCookieFields(user);

    return res.status(HttpStatus.CREATED).json({
      message: "User successfully registered.",
    });
  }

  @Post("login")
  async login(
    @Body() loginUserDTO: LoginUserDTO,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const user = await this.authService.login(loginUserDTO);

    (req as any).session.user = this.authService.getUserCookieFields(user);

    return res.status(HttpStatus.CREATED).json({
      data: getPublicUser(user),
    });
  }
}
