import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { AddCommentData } from './comment.model';

@Injectable()
export class CommentService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async addCommentToDebate(commentData: AddCommentData) {
    // Performing a conditional insert because we want to ensure
    // that only the user & moderator _connected_ to the ticket
    // are allowed to add comments.
    const sqlStr = `
      insert into ticket_comment(ticket_id, content, commenter_id)
      select $1, $2, $3
      where exists (
        select 1 from debate d where d.ticket_id = $4
      ) and exists (
        select 1
        from ticket
        where id = $5 and (created_by = $6 or assigned_to = $7)
      )
      returning *;
    `;
    const values = [
      commentData.ticketId,
      commentData.content,
      commentData.commenterId,
      commentData.ticketId,
      commentData.ticketId,
      commentData.commenterId,
      commentData.commenterId,
    ];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStr, values);
      if (!res.rowCount) {
        throw new Error('Ticket and commenter are not connected.')
      }

      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}
