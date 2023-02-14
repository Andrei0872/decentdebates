import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserService } from 'src/user/user.service';
import { RegisterUserDTO } from '../user/dtos/register-user.dto';

@Injectable()
export class AuthService {
  constructor (
    @Inject(PG_PROVIDER_TOKEN) pool: Pool,
    private userService: UserService,
  ) { }
  
  public async register (registerUserDTO: RegisterUserDTO) {
    // TODO: Hash password
    try {
      return await this.userService.insertOne(registerUserDTO);
    } catch (err) {
      throw new Error('An error occurred while registering the user.');
    }
  }

  public login () {}
}
