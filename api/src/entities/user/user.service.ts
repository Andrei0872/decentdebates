import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { RegisterUserDTO } from './dtos/register-user.dto';
import { User, UserCookieData, UserActivityArgument, UserActivityDebate } from './user.model';

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

  async getActivityDebates(user: UserCookieData): Promise<UserActivityDebate[]> {
    const sqlStr = `
      select
        t.id "ticketId",
        t.board_list "boardList",
        d.title "debateTitle",
        d.id "debateId",
        'debate' "cardType",
        u.username "moderatorUsername",
        case
          when t.board_list = 'ACCEPTED' then 'SOLVED'
          else 'ONGOING'
        end "activityList"
      from ticket t
      right join debate d
        on d.ticket_id = t.id
      left join "user" u
        on u.id = t.assigned_to
      where
        t.created_by = $1
      order by d.created_at desc
    `;
    const values = [user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);

      return res.rows;
    } catch (err) {
      console.error(err);
      throw new Error('An error occurred while fetching the user\'s activity(debates).');
    } finally {
      client.release();
    }
  }

  async getActivityArguments(user: UserCookieData): Promise<UserActivityArgument[]> {
    const sqlStr = `
      select
        a.id "argumentId",
        a.title "argumentTitle",
        a.type "argumentType",
        a.is_draft "argumentIsDraft",
        t.board_list "boardList",
        case
          when t.board_list is null then 'ONGOING'
          when t.board_list = 'ACCEPTED' then 'SOLVED'
          else 'ONGOING'
        end "activityList",
        d.title "debateTitle",
        d.id "debateId",
        'argument' "cardType",
        u.username "moderatorUsername"
      from argument a
      left join ticket t
        on t.id = a.ticket_id
      join debate d
        on d.id = a.debate_id
      left join "user" u
        on t.created_by = u.id
      where a.created_by = $1
      order by a.created_at desc
    `;
    const values = [user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);

      return res.rows;
    } catch (err) {
      console.error(err);
      throw new Error('An error occurred while fetching the user\'s activity(arguments).');
    } finally {
      client.release();
    }
  }
}
