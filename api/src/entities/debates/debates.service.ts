import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { Debate } from './debates.model';

@Injectable()
export class DebatesService {
  constructor (@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }
  
  async getAll (): Promise<Debate[]> {
    const client = await this.pool.connect();
    const sqlStr = `
      select
        d.id,
        d.title,
        d.created_at "createdAt",
        d.modified_at "modifiedAt",
        u.username,
        u.id "userId"
      from debate d
      join ticket t
        on d.ticket_id = t.id
      join "user" u
        on u.id = t.created_by
    `;

    try {
      const res = await client.query(sqlStr);
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the debates.');
    }
  }
}