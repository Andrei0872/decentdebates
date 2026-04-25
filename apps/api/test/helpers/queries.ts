import type { Pool } from "pg";

export async function getDebateTicketId(pool: Pool, debateId: number) {
  const result = await pool.query<{ ticket_id: number }>(
    "select ticket_id from debate where id = $1",
    [debateId],
  );

  return result.rows[0].ticket_id;
}

export async function getArgumentIdByDebateAndTitle(
  pool: Pool,
  debateId: number,
  title: string,
) {
  const result = await pool.query<{ id: number }>(
    `
      select id
      from argument
      where debate_id = $1 and title = $2
    `,
    [debateId, title],
  );

  return result.rows[0].id;
}

export async function getDraftArgumentState(
  pool: Pool,
  debateId: number,
  title: string,
) {
  const result = await pool.query<{
    id: number;
    ticket_id: number | null;
    is_draft: boolean;
  }>(
    `
      select id, ticket_id, is_draft
      from argument
      where debate_id = $1 and title = $2
    `,
    [debateId, title],
  );

  return result.rows[0];
}

export async function getArgumentSnapshot(pool: Pool, argumentId: number) {
  const result = await pool.query<{
    title: string;
    content: string;
    type: string;
  }>(
    `
      select title, content, type
      from argument
      where id = $1
    `,
    [argumentId],
  );

  return result.rows[0];
}

export async function getSubmittedDraftSnapshot(
  pool: Pool,
  argumentId: number,
) {
  const result = await pool.query<{
    is_draft: boolean;
    title: string;
    content: string;
    type: string;
    ticket_id: number;
    board_list: string;
  }>(
    `
      select
        a.is_draft,
        a.title,
        a.content,
        a.type,
        a.ticket_id,
        t.board_list
      from argument a
      join ticket t
        on t.id = a.ticket_id
      where a.id = $1
    `,
    [argumentId],
  );

  return result.rows[0];
}

export async function getFirstCommentIdByTicketAndCommenter(
  pool: Pool,
  ticketId: number,
  commenterId: number,
) {
  const result = await pool.query<{ id: number }>(
    `
      select id
      from ticket_comment
      where ticket_id = $1 and commenter_id = $2
      order by id asc
      limit 1
    `,
    [ticketId, commenterId],
  );

  return result.rows[0].id;
}

export async function getTicketState(pool: Pool, ticketId: number) {
  const result = await pool.query<{
    board_list: string;
    assigned_to: number | null;
  }>("select board_list, assigned_to from ticket where id = $1", [ticketId]);

  return result.rows[0];
}

export async function getNotificationIdsForRecipient(
  pool: Pool,
  recipientId: number,
) {
  const result = await pool.query<{ id: number }>(
    "select id from notification where recipient_id = $1 order by id asc",
    [recipientId],
  );

  return result.rows.map((row) => row.id);
}

export async function getNotificationsByTitle(pool: Pool, title: string) {
  const result = await pool.query<{ recipient_id: number; title: string }>(
    "select recipient_id, title from notification where title = $1",
    [title],
  );

  return result.rows;
}

export async function getNotificationRecipientIdsByTitle(
  pool: Pool,
  title: string,
) {
  const result = await pool.query<{ recipient_id: number }>(
    "select recipient_id from notification where title = $1 order by recipient_id asc",
    [title],
  );

  return result.rows;
}
