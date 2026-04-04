import type { Pool } from 'pg';

export async function createUser(pool: Pool, overrides?: Partial<{ username: string; email: string; role: 'USER' | 'MODERATOR' }>) {
  const uniqueSuffix = `${Date.now()}-${Math.random()}`;
  const result = await pool.query<{ id: number }>(
    `
      insert into "user" (username, password, email, role)
      values ($1, $2, $3, $4)
      returning id
    `,
    [
      overrides?.username ?? `user-${uniqueSuffix}`,
      'test-password',
      overrides?.email ?? `user-${uniqueSuffix}@example.com`,
      overrides?.role ?? 'USER',
    ],
  );

  return result.rows[0].id;
}

export async function createTag(pool: Pool, name: string) {
  const result = await pool.query<{ id: number }>(
    `
      insert into debate_tag (name)
      values ($1)
      returning id
    `,
    [name],
  );

  return result.rows[0].id;
}

export async function createTicket(pool: Pool, data: {
  createdBy: number;
  assignedTo?: number | null;
  boardList?: 'PENDING' | 'IN REVIEW' | 'ACCEPTED' | 'CANCELED' | null;
}) {
  const result = await pool.query<{ id: number }>(
    `
      insert into ticket (created_by, assigned_to, board_list)
      values ($1, $2, $3)
      returning id
    `,
    [data.createdBy, data.assignedTo ?? null, data.boardList ?? null],
  );

  return result.rows[0].id;
}

export async function createDebate(pool: Pool, data: {
  title: string;
  createdBy: number;
  boardList: 'PENDING' | 'IN REVIEW' | 'ACCEPTED' | 'CANCELED';
  tagIds: number[];
  assignedTo?: number | null;
}) {
  const ticketId = await createTicket(pool, {
    createdBy: data.createdBy,
    assignedTo: data.assignedTo,
    boardList: data.boardList,
  });

  const debateResult = await pool.query<{ id: number }>(
    `
      insert into debate (ticket_id, title, created_by)
      values ($1, $2, $3)
      returning id
    `,
    [ticketId, data.title, data.createdBy],
  );
  const debateId = debateResult.rows[0].id;

  for (const tagId of data.tagIds) {
    await pool.query(
      `
        insert into assoc_debate_tag (debate_id, tag_id)
        values ($1, $2)
      `,
      [debateId, tagId],
    );
  }

  return debateId;
}

export async function createArgument(pool: Pool, data: {
  debateId: number;
  createdBy: number;
  title: string;
  content: string;
  argumentType: 'PRO' | 'CON';
  counterargumentTo?: number | null;
  ticketId?: number | null;
  isDraft?: boolean;
  assignedTo?: number | null;
  boardList?: 'PENDING' | 'IN REVIEW' | 'ACCEPTED' | 'CANCELED' | null;
}) {
  const ticketId = data.ticketId === undefined
    ? await createTicket(pool, {
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      boardList: data.boardList ?? null,
    })
    : data.ticketId;

  const result = await pool.query<{ id: number }>(
    `
      insert into argument (debate_id, ticket_id, title, content, counterargument_to, created_by, type, is_draft)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning id
    `,
    [
      data.debateId,
      ticketId,
      data.title,
      data.content,
      data.counterargumentTo ?? null,
      data.createdBy,
      data.argumentType,
      data.isDraft ?? false,
    ],
  );

  return {
    argumentId: result.rows[0].id,
    ticketId,
  };
}

export async function createComment(pool: Pool, data: {
  ticketId: number;
  content: string;
  commenterId: number;
}) {
  const result = await pool.query<{ id: number }>(
    `
      insert into ticket_comment (ticket_id, content, commenter_id)
      values ($1, $2, $3)
      returning id
    `,
    [data.ticketId, data.content, data.commenterId],
  );

  return result.rows[0].id;
}

export async function createNotification(pool: Pool, data: {
  title: string;
  content: string;
  recipientId: number;
  event: 'ARGUMENT' | 'DEBATE' | 'SUGGESTION';
  isRead?: boolean;
}) {
  const result = await pool.query<{ id: number }>(
    `
      insert into notification (title, content, recipient_id, event, is_read)
      values ($1, $2, $3, $4, $5)
      returning id
    `,
    [data.title, data.content, data.recipientId, data.event, data.isRead ?? false],
  );

  return result.rows[0].id;
}
