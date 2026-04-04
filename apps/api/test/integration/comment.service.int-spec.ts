import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { Pool } from 'pg';
import { CommentService } from '../../src/entities/comment/comment.service';
import { applySchema, createTestPool, recreateTestDatabase } from '../helpers/db';
import { createArgument, createComment, createDebate, createTag, createUser } from '../helpers/factories';
import { getDebateTicketId, getFirstCommentIdByTicketAndCommenter } from '../helpers/queries';

describe('CommentService integration', () => {
  let service: CommentService;
  let pool: Pool;
  let userId: number;
  let moderatorId: number;
  let outsiderId: number;
  let debateTicketId: number;
  let argumentTicketId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new CommentService(pool as never);

    userId = await createUser(pool, {
      username: 'comment-user',
      email: 'comment-user@example.com',
    });
    moderatorId = await createUser(pool, {
      username: 'comment-moderator',
      email: 'comment-moderator@example.com',
      role: 'MODERATOR',
    });
    outsiderId = await createUser(pool, {
      username: 'comment-outsider',
      email: 'comment-outsider@example.com',
    });

    const tagId = await createTag(pool, 'comments');
    const debateId = await createDebate(pool, {
      title: 'Comments debate',
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: 'IN REVIEW',
      tagIds: [tagId],
    });
    debateTicketId = await getDebateTicketId(pool, debateId);

    const argument = await createArgument(pool, {
      debateId,
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: 'IN REVIEW',
      title: 'Commentable argument',
      content: 'Argument content',
      argumentType: 'PRO',
    });
    argumentTicketId = argument.ticketId as number;
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('adds a comment to a debate ticket for a connected participant', async () => {
    const comment = await service.addCommentToDebate({
      ticketId: debateTicketId,
      content: 'User debate comment',
      commenterId: userId,
    });

    expect(comment).toEqual(
      expect.objectContaining({
        content: 'User debate comment',
        commenterId: userId,
        commenterUsername: 'comment-user',
      }),
    );
  });

  it('adds a comment to an argument ticket for a connected moderator', async () => {
    const comment = await service.addCommentToArgument({
      ticketId: argumentTicketId,
      content: 'Moderator argument comment',
      commenterId: moderatorId,
    });

    expect(comment).toEqual(
      expect.objectContaining({
        content: 'Moderator argument comment',
        commenterId: moderatorId,
        commenterUsername: 'comment-moderator',
      }),
    );
  });

  it('rejects a commenter who is not connected to the ticket', async () => {
    await expect(
      service.addCommentToDebate({
        ticketId: debateTicketId,
        content: 'Outsider comment',
        commenterId: outsiderId,
      }),
    ).rejects.toThrow('Ticket and commenter are not connected.');
  });

  it('returns ticket comments only to connected participants', async () => {
    await createComment(pool, {
      ticketId: debateTicketId,
      content: 'Second debate comment',
      commenterId: moderatorId,
    });

    const comments = await service.getTicketComments(String(debateTicketId), {
      id: userId,
      username: 'comment-user',
      role: 'USER' as never,
    });

    expect(comments.map(comment => comment.content)).toEqual([
      'User debate comment',
      'Second debate comment',
    ]);
  });

  it('updates only the owner comment', async () => {
    const commentId = await getFirstCommentIdByTicketAndCommenter(pool, debateTicketId, userId);

    const result = await service.updateComment(
      {
        id: userId,
        username: 'comment-user',
        role: 'USER' as never,
      },
      {
        commentId,
        content: 'Updated user debate comment',
      },
    );

    expect(result.rowCount).toBe(1);
  });
});
