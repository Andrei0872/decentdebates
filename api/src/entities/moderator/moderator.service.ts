import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserCookieData } from '../user/user.model';
import { UpdateTicketDTO } from './dtos/update-ticket.dto';
import { ModeratorActivity, ModeratorActivityArgument, ModeratorActivityDebate, UpdateTicketData } from './moderator.model';

@Injectable()
export class ModeratorService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async getDebateCards(): Promise<ModeratorActivityDebate[]> {
    const sqlStr = `
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
        end "ticketLabel"
      from ticket t
      right join debate d
        on d.ticket_id = t.id
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
      console.error(err);
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
      console.error(err);
      throw new Error('An error occurred while fetching the moderator\'s activity(arguments).');
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
      console.error(err.message);
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
      where id = $1 and assigned_to = $2;
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
      console.error(err.message);
      throw new Error('An error occurred while updated the ticket.');
    } finally {
      client.release();
    }
  }
}
