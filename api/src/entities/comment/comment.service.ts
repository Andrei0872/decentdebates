import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserCookieData } from '../user/user.model';
import { AddCommentData, Comment, UpdateCommentData } from './comment.model';

@Injectable()
export class CommentService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

  async addCommentToDebate(commentData: AddCommentData): Promise<Comment> {
    // Performing a conditional insert because we want to ensure
    // that only the user & moderator _connected_ to the ticket
    // are allowed to add comments.
    const sqlStr = `
      with insertedComment as (
        insert into ticket_comment(ticket_id, content, commenter_id)
        select $1, $2, $3
        where exists (
          select 1 from debate d where d.ticket_id = $4
        ) and exists (
          select 1
          from ticket
          where id = $5 and (created_by = $6 or assigned_to = $7)
        )
        returning *
      )
      select
        ic.id "commentId",
        ic.content,
        ic.commenter_id "commenterId",
        ic.created_at "createdAt",
        ic.modified_at "modifiedAt",
        u.username "commenterUsername"
      from insertedComment ic
      join "user" u
        on u.id = ic.commenter_id
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

  async getTicketComments(ticketId: string, user: UserCookieData): Promise<Comment[]> {
    const sqlStr = `
      select
        tc.id "commentId",
        tc.content,
        tc.commenter_id "commenterId",
        tc.created_at "createdAt",
        tc.modified_at "modifiedAt",
        u.username "commenterUsername"
      from ticket_comment tc
      join ticket t
        on t.id = tc.ticket_id
      join "user" u
        on u.id = tc.commenter_id
      where t.id = $1 and (t.created_by = $2 or t.assigned_to = $3)
      order by tc.created_at asc
    `;
    const values = [
      ticketId,
      user.id,
      user.id,
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);

      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the comments.');
    } finally {
      client.release();
    }
  }

  async updateComment(user: UserCookieData, commentData: UpdateCommentData) {
    const sqlStr = `
      update ticket_comment
      set
        content = $1,
        modified_at = now()
      where id = $2 and commenter_id = $3
    `;
    const values = [
      commentData.content,
      commentData.commentId,
      user.id
    ];

    const client = await this.pool.connect();

    try {
      const res = await client.query(sqlStr, values);
      return res;
    } catch (err) {
      console.error(err.message);
      throw new Error('An error occurred while fetching the comments.');
    } finally {
      client.release();
    }
  }

  async addCommentToArgument(commentData: AddCommentData): Promise<Comment> {
    const sqlStr = `
      with insertedComment as (
        insert into ticket_comment(ticket_id, content, commenter_id)
        select $1, $2, $3
        where exists (
          select 1 from argument a where a.ticket_id = $4
        ) and exists (
          select 1
          from ticket
          where id = $5 and (created_by = $6 or assigned_to = $7)
        )
        returning *
      )
      select
        ic.id "commentId",
        ic.content,
        ic.commenter_id "commenterId",
        ic.created_at "createdAt",
        ic.modified_at "modifiedAt",
        u.username "commenterUsername"
      from insertedComment ic
      join "user" u
        on u.id = ic.commenter_id
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
