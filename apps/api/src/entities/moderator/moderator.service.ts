import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from '@decentdebates/db';
import { ArgumentAsModerator, DebateAsModerator } from '../review/review.model';
import { UserCookieData } from '../user/user.model';
import { UpdateTicketDTO } from './dtos/update-ticket.dto';
import { ModeratorActivity, ModeratorActivityArgument, ModeratorActivityDebate, UpdateTicketData } from './moderator.model';

@Injectable()
export class ModeratorService {
  private readonly logger = new Logger(ModeratorService.name);

  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
  ) { }

  private logError(err: unknown) {
    this.logger.error(err instanceof Error ? err.message : String(err));
  }

  async getDebateCards(): Promise<ModeratorActivityDebate[]> {
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
        case
          when t.board_list is null then boardListTypes."boardList"
          else t.board_list
        end "boardList",
        t.assigned_to "moderatorId",
        d.title "ticketTitle",
        u.username "moderatorUsername",
        case
          when d.id is not null then 'debate'
        end "ticketLabel",
        dts."tags",
        dts."tagsIds",
        d.id "debateId"
      from ticket t
      right join debate d
        on d.ticket_id = t.id
      join debates_tags dts
        on d.id = dts."debateId"
      left join "user" u
        on u.id = t.assigned_to
      right join (
        select unnest(enum_range(NULL::board_list_type)) "boardList"
      ) boardListTypes
        on t.board_list = boardListTypes."boardList"
    `;
    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr);

      return res.rows;
    } catch (err) {
      this.logError(err);
      throw new Error('An error occurred while fetching the moderator\'s activity(debates).');
    } finally {
      client.release();
    }
  }

  async getArgumentCards(): Promise<ModeratorActivityArgument[]> {
    const sqlStr = `
      select
        t.id "ticketId",
        case
          when t.board_list is null then boardListTypes."boardList"
          else t.board_list
        end "boardList",
        t.assigned_to "moderatorId",
        a.title "ticketTitle",
        a.type "argumentType",
        a.debate_id "debateId",
        u.username "moderatorUsername",
        'argument' "ticketLabel",
        d.title "debateTitle",
        a.id "argumentId"
      from ticket t
      join argument a
        on a.ticket_id = t.id
      join debate d
        on a.debate_id = d.id
      left join "user" u
        on u.id = t.assigned_to
      right join (
        select unnest(enum_range(NULL::board_list_type)) "boardList"
      ) boardListTypes
        on t.board_list = boardListTypes."boardList"
    `;
    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr);

      return res.rows;
    } catch (err) {
      this.logError(err);
      throw new Error('An error occurred while fetching the moderator\'s activity(arguments).');
    } finally {
      client.release();
    }
  }

  async getArgumentAsModerator(user: UserCookieData, ticketId: string): Promise<ArgumentAsModerator> {
    const sqlStr = `
      select
        t.id "ticketId",
        t.created_by "userId",
        a.debate_id "debateId",
        a.title "argumentTitle",
        a.content "argumentContent",
        a.counterargument_to "counterargumentToId",
        a.type "argumentType",
        d.title "debateTitle",
        t.board_list "boardList",
        aCounterarg.title "counterargumentToTitle",
        u.username,
        t.assigned_to "assignedToId"
      from ticket t
      join argument a
        on a.ticket_id = t.id
      join debate d
        on d.id = a.debate_id
      join "user" u
        on u.id = t.created_by
      left join argument aCounterarg
        on aCounterarg.id = a.counterargument_to
      where t.id = $1 and a.is_draft = false and t.assigned_to = $2
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

  async getDebateAsModerator(user: UserCookieData, ticketId: string): Promise<DebateAsModerator> {
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
        u.username,
        u.id "userId",
        dt."tags",
        t.board_list "boardList",
        t.id "ticketId",
        dt."tagsIds",
        t.assigned_to "assignedToId"
      from debate d
      join "user" u
        on u.id = d.created_by
      join debates_tags dt
        on dt."debateId" = d.id
      join ticket t
        on d.ticket_id = t.id
      where d.ticket_id = $1 and t.assigned_to = $2;
    `;
    const values = [ticketId, user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      return res.rows[0];
    } catch (err) {
      this.logError(err);
      throw new Error('An error occurred while fetching the debate.');
    } finally {
      client.release();
    }
  }

  async updateTicket(ticket: UpdateTicketData) {
    const sqlStr = `
      update ticket 
      set
        board_list = $1,
        assigned_to = case
          when board_list = 'PENDING' then $2
          when $3 = 'PENDING' then null
          else assigned_to
        end
      where
        id = $4
          and (board_list = 'PENDING' or board_list <> 'PENDING' and assigned_to = $5);
    `;
    const values = [
      ticket.ticketData.boardList,
      ticket.userId,
      ticket.ticketData.boardList,
      +ticket.ticketId,
      ticket.userId,
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);

      if (!res.rowCount) {
        throw new Error('Wrong attempt to update the ticket.');
      }
    } catch (err) {
      this.logError(err);
      throw new Error('An error occurred while updated the ticket.');
    } finally {
      client.release();
    }
  }

  async approveTicket(user: UserCookieData, ticketId: string) {
    const sqlStr = `
      update ticket 
      set
        board_list = 'ACCEPTED'
      where id = $1 and assigned_to = $2
      returning created_by;
    `;
    const values = [
      ticketId,
      user.id,
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      return res;
    } catch (err) {
      this.logError(err);
      throw new Error('An error occurred while updated the ticket.');
    } finally {
      client.release();
    }
  }
}
