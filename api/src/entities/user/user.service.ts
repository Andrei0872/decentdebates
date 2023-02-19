import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { RegisterUserDTO } from './dtos/register-user.dto';
import { User, UserActivity, UserCookieData } from './user.model';

const TABLE_NAME = `"user"`;
const TABLE_COLUMNS = `(username, password, email, role)`;

@Injectable()
export class UserService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  public async insertOne(registerUserDTO: RegisterUserDTO): Promise<User> {
    const client = await this.pool.connect();
    const values = [registerUserDTO.username, registerUserDTO.password, registerUserDTO.email, 'USER'];

    try {
      const res = await client.query(
        `
          insert into ${TABLE_NAME} ${TABLE_COLUMNS}
          values ($1, $2, $3, $4)
          returning *
        `,
        values
      );

      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async getOneByEmailOrUsername(emailOrUsername): Promise<User> {
    const sqlStr = `
      select
        id,
        username,
        email,
        role,
        password
      from "user" u
      where u.username = $1 or u.email = $1;
    `;
    const values = [emailOrUsername];

    const client = await this.pool.connect();
    const res = await client.query(sqlStr, values);

    client.release();

    return res.rows[0];
  }

  async getOngoingItems(user: UserCookieData): Promise<UserActivity[]> {
    const sqlStl = `
      select
        t.id "ticketId",
        t.board_list "boardList",
        d.title,
        d.id "debateId",
        case
          when d.id is not null then 'DEBATE'
        end "itemType",
        u.username "moderatorUsername"
      from ticket t
      join debate d
        on d.ticket_id = t.id
      left join "user" u
        on u.id = t.assigned_to
      where
        t.created_by = $1
        and t.board_list <> 'ACCEPTED'
    `;
    const values = [user.id];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStl, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the ongoing activities');
    } finally {
      client.release();
    }
  }

  async getSolvedItems(user: UserCookieData): Promise<UserActivity[]> {
    const sqlStl = `
      select
        t.id "ticketId",
        t.board_list "boardList",
        d.title,
        d.id "debateId",
        case
          when d.id is not null then 'DEBATE'
        end "itemType",
        u.username "moderatorUsername"
      from ticket t
      join debate d
        on d.ticket_id = t.id
      join "user" u
        on u.id = t.assigned_to
      where
        t.created_by = $1
        and t.board_list = 'ACCEPTED'
    `;
    const values = [user.id];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStl, values);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the solved activities');
    } finally {
      client.release();
    }
  }
}
