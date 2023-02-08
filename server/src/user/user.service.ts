import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { RegisterUserDTO } from './dtos/register-user.dto';

const TABLE_NAME = `"user"`;
const TABLE_COLUMNS = `(username, password, email, role)`;

@Injectable()
export class UserService {
  constructor (@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  public async insertOne (registerUserDTO: RegisterUserDTO) {
    const client = await this.pool.connect();
    const values = [registerUserDTO.username, registerUserDTO.password, registerUserDTO.email, 'USER'];

    try {
      const res = await client.query(
        `
          insert into ${TABLE_NAME} ${TABLE_COLUMNS}
          values ($1, $2, $3, $4)
        `,
        values
      );
      console.log(res);
    } catch (err) {
      console.log(err);
    } finally {
      client.release();
    }
  }
}
