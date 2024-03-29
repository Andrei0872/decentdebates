import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserService } from 'src/entities/user/user.service';
import { RegisterUserDTO } from '../entities/user/dtos/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDTO } from 'src/entities/user/dtos/login-user.dto';
import { InvalidCredentialsError } from './errors/invalid-credentials.error';
import { PublicUser, UserCookieData } from 'src/entities/user/user.model';

const SALT_OR_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor (
    @Inject(PG_PROVIDER_TOKEN) pool: Pool,
    private userService: UserService,
  ) { }
  
  public async register (registerUserDTO: RegisterUserDTO) {
    try {
      registerUserDTO.password = await this.hashPassword(registerUserDTO.password);
      return await this.userService.insertOne(registerUserDTO);
    } catch (err) {
      throw new Error('An error occurred while registering the user.');
    }
  }

  public async login (loginUserDTO: LoginUserDTO) {
    const user = await this.userService.getOneByEmailOrUsername(loginUserDTO.emailOrUsername);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const doPasswordsMatch = await bcrypt.compare(loginUserDTO.password, user.password);
    if (!doPasswordsMatch) {
      throw new InvalidCredentialsError();
    }

    return user;
  }

  getUserCookieFields (u: PublicUser): UserCookieData {
    return {
      id: u.id,
      role: u.role,
      username: u.username,
    };
  }

  private async hashPassword (rawPass: string) {
    const hash = await bcrypt.hash(rawPass, SALT_OR_ROUNDS);
    return hash;
  }
}
