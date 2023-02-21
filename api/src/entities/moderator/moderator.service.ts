import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { ModeratorActivity } from './moderator.model';

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
        d.title "ticketTitle"
      from ticket t
      join debate d
        on d.ticket_id = t.id
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
}
