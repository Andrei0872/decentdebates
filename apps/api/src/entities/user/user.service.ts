import { Inject, Injectable, Logger } from "@nestjs/common";
import { Pool } from "pg";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { ArgumentAsUser, DebateAsUser } from "../review/review.model";
import { RegisterUserDTO } from "./dtos/register-user.dto";
import {
  User,
  UserCookieData,
  UserActivityArgument,
  UserActivityDebate,
} from "./user.model";

const TABLE_NAME = `"user"`;
const TABLE_COLUMNS = `(username, password, email, role)`;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) {}

  private logError(err: unknown) {
    this.logger.error(err instanceof Error ? err.message : String(err));
  }

  public async insertOne(registerUserDTO: RegisterUserDTO): Promise<User> {
    const client = await this.pool.connect();
    const values = [
      registerUserDTO.username,
      registerUserDTO.password,
      registerUserDTO.email,
      "USER",
    ];

    try {
      const res = await client.query(
        `
          insert into ${TABLE_NAME} ${TABLE_COLUMNS}
          values ($1, $2, $3, $4)
          returning *
        `,
        values,
      );

      return res.rows[0];
    } catch (err) {
      this.logError(err);
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

  async getActivityDebates(
    user: UserCookieData,
  ): Promise<UserActivityDebate[]> {
    const sqlStr = `
      with debates_tags as (
        select
          d.id "debateId",
          string_agg(dt.name, ',') "tags",
          string_agg(dt.id::text, ',') "tagsIds"
        from debate d
        join assoc_debate_tag adt
          on adt.debate_id = d.id
        join debate_tag dt
          on dt.id = adt.tag_id
        group by d.id
      )
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
        end "activityList",
        dts."tags",
        dts."tagsIds"
      from ticket t
      right join debate d
        on d.ticket_id = t.id
      join debates_tags dts
        on d.id = dts."debateId"
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
      this.logError(err);
      throw new Error(
        "An error occurred while fetching the user's activity(debates).",
      );
    } finally {
      client.release();
    }
  }

  async getActivityArguments(
    user: UserCookieData,
  ): Promise<UserActivityArgument[]> {
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
        u.username "moderatorUsername",
        t.id "ticketId"
      from argument a
      left join ticket t
        on t.id = a.ticket_id
      join debate d
        on d.id = a.debate_id
      left join "user" u
        on t.assigned_to = u.id
      where a.created_by = $1
      order by a.created_at desc
    `;
    const values = [user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);

      return res.rows;
    } catch (err) {
      this.logError(err);
      throw new Error(
        "An error occurred while fetching the user's activity(arguments).",
      );
    } finally {
      client.release();
    }
  }

  async getDebateAsUser(
    user: UserCookieData,
    ticketId: string,
  ): Promise<DebateAsUser> {
    const sqlStr = `
      with debates_tags as (
        select
          d.id "debateId",
          string_agg(dt.name, ',') "tags",
          string_agg(dt.id::text, ',') "tagsIds"
        from debate d
        join assoc_debate_tag adt
          on adt.debate_id = d.id
        join debate_tag dt
          on dt.id = adt.tag_id
        group by d.id
      )
      select
        d.id,
        d.title,
        d.ticket_id "ticketId",
        d.created_at "createdAt",
        d.modified_at "modifiedAt",
        u.username "moderatorUsername",
        u.id "moderatorId",
        dt."tags",
        t.board_list "boardList",
        t.id "ticketId",
        dt."tagsIds",
        t.assigned_to "assignedToId",
        t.created_by "userId"
      from debate d
      join debates_tags dt
        on dt."debateId" = d.id
      join ticket t
        on d.ticket_id = t.id
      left join "user" u
        on u.id = t.assigned_to
      where d.ticket_id = $1 and t.created_by = $2;
    `;
    const values = [ticketId, user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res.rows[0];
    } catch (err) {
      this.logError(err);
      throw new Error("An error occurred while fetching the debate.");
    } finally {
      client.release();
    }
  }

  async getArgumentAsUser(
    user: UserCookieData,
    ticketId: string,
  ): Promise<ArgumentAsUser> {
    const sqlStr = `
      select
        t.id "ticketId",
        u.id "moderatorId",
        a.debate_id "debateId",
        a.title "argumentTitle",
        a.content "argumentContent",
        a.counterargument_to "counterargumentToId",
        a.type "argumentType",
        d.title "debateTitle",
        t.board_list "boardList",
        aCounterarg.title "counterargumentToTitle",
        u.username "moderatorUsername",
        a.id "argumentId",
        t.assigned_to "assignedToId",
        t.created_by "userId"
      from ticket t
      join argument a
        on a.ticket_id = t.id
      join debate d
        on d.id = a.debate_id
      left join "user" u
        on u.id = t.assigned_to
      left join argument aCounterarg
        on aCounterarg.id = a.counterargument_to
      where t.id = $1 and a.is_draft = false and t.created_by = $2
    `;
    const values = [ticketId, user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res.rows[0];
    } catch (err) {
      this.logError(err);
      throw err;
    } finally {
      client.release();
    }
  }
}
