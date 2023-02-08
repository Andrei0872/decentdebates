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
  
  public register (registerUserDTO: RegisterUserDTO) {
    // Check if user exists
    // If yes: throw error
    // Hash password
    // Insert into `users` table
    this.userService.insertOne(registerUserDTO);
  }

  public login () {}
}
