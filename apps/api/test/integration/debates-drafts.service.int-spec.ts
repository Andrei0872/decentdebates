import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { Pool } from 'pg';
import { DebatesService } from '../../src/entities/debates/debates.service';
import { ArgumentType } from '../../src/entities/debates/debates.model';
import { applySchema, createTestPool, recreateTestDatabase } from '../helpers/db';
import { createDebate, createTag, createUser } from '../helpers/factories';
import { getArgumentIdByDebateAndTitle, getArgumentSnapshot, getDraftArgumentState, getSubmittedDraftSnapshot } from '../helpers/queries';

describe('DebatesService draft flow integration', () => {
  let service: DebatesService;
  let pool: Pool;
  let userId: number;
  let debateId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new DebatesService(pool as never, {} as EventEmitter2);

    userId = await createUser(pool, {
      username: 'draft-user',
      email: 'draft-user@example.com',
    });
    const tagId = await createTag(pool, 'drafts');
    debateId = await createDebate(pool, {
      title: 'Draft debate',
      createdBy: userId,
      boardList: 'ACCEPTED',
      tagIds: [tagId],
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('saves a draft without creating a ticket', async () => {
    await service.saveArgumentAsDraft({
      user: {
        id: userId,
        username: 'draft-user',
        role: 'USER' as never,
      },
      debateId,
      argumentDetails: {
        title: 'Draft argument',
        content: 'Draft content',
        argumentType: ArgumentType.PRO,
        counterargumentId: undefined,
      },
    });

    const result = await getDraftArgumentState(pool, debateId, 'Draft argument');

    expect(result).toEqual(
      expect.objectContaining({
        ticket_id: null,
        is_draft: true,
      }),
    );
  });

  it('returns the saved draft for its owner', async () => {
    const draftId = await getArgumentIdByDebateAndTitle(pool, debateId, 'Draft argument');

    const draft = await service.getDraft({
      user: {
        id: userId,
        username: 'draft-user',
        role: 'USER' as never,
      },
      debateId,
      argumentId: draftId,
    });

    expect(draft).toEqual(
      expect.objectContaining({
        debateId,
        title: 'Draft argument',
        content: 'Draft content',
        createdById: userId,
      }),
    );
  });

  it('updates a draft in place', async () => {
    const draftId = await getArgumentIdByDebateAndTitle(pool, debateId, 'Draft argument');

    await service.updateDraft({
      user: {
        id: userId,
        username: 'draft-user',
        role: 'USER' as never,
      },
      debateId,
      draftId,
      draftData: {
        title: 'Updated draft',
        content: 'Updated draft content',
        argumentType: ArgumentType.CON,
        counterargumentId: undefined,
      },
    });

    const result = await getArgumentSnapshot(pool, draftId);

    expect(result).toEqual({
      title: 'Updated draft',
      content: 'Updated draft content',
      type: ArgumentType.CON,
    });
  });

  it('submits a draft by creating a ticket and clearing the draft flag', async () => {
    const draftId = await getArgumentIdByDebateAndTitle(pool, debateId, 'Updated draft');

    await service.submitDraft({
      user: {
        id: userId,
        username: 'draft-user',
        role: 'USER' as never,
      },
      debateId,
      draftId,
      draftData: {
        title: 'Submitted draft',
        content: 'Submitted draft content',
        argumentType: ArgumentType.PRO,
        counterargumentId: undefined,
      },
    });

    const result = await getSubmittedDraftSnapshot(pool, draftId);

    expect(result).toEqual({
      is_draft: false,
      title: 'Submitted draft',
      content: 'Submitted draft content',
      type: ArgumentType.PRO,
      ticket_id: expect.any(Number),
      board_list: 'PENDING',
    });
  });
});
