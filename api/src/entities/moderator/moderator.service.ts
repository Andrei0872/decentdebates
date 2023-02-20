import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';

@Injectable()
export class ModeratorService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async getActivity() {
    const sqlStr = `
      select
        t.id "ticketId",
        t.board_list "boardList",
        t.assigned_to "moderatorId",
        d.title "ticketTitle"
      from ticket t
      join debate d
        on d.ticket_id = t.id
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
