import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UpdateTicketDTO } from './dtos/update-ticket.dto';
import { ModeratorActivity, UpdateTicketData } from './moderator.model';

@Injectable()
export class ModeratorService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async getActivity(): Promise<ModeratorActivity[]> {
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
      throw new Error('An error occurred while fetching the moderator\'s activity.');
    } finally {
      client.release();
    }
  }

  async updateTicket (ticket: UpdateTicketData) {
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
}
