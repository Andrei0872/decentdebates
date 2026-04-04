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

export async function createDebate(pool: Pool, data: {
  title: string;
  createdBy: number;
  boardList: 'PENDING' | 'IN REVIEW' | 'ACCEPTED' | 'CANCELED';
  tagIds: number[];
}) {
  const ticketResult = await pool.query<{ id: number }>(
    `
      insert into ticket (created_by, assigned_to, board_list)
      values ($1, null, $2)
      returning id
    `,
    [data.createdBy, data.boardList],
  );
  const ticketId = ticketResult.rows[0].id;

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
