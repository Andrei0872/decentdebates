import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { Pool } from 'pg';
import { DebatesService, TagsMatchingStrategy } from '../../src/entities/debates/debates.service';
import { applySchema, createTestPool, recreateTestDatabase } from '../helpers/db';
import { createDebate, createTag, createUser } from '../helpers/factories';

describe('DebatesService integration', () => {
  let service: DebatesService;
  let pool: Pool;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new DebatesService(pool as any, {} as EventEmitter2);

    const userId = await createUser(pool, {
      username: 'debates-user',
      email: 'debates-user@example.com',
    });
    const historyTagId = await createTag(pool, 'history');
    const communityTagId = await createTag(pool, 'community');
    const healthTagId = await createTag(pool, 'health');

    await createDebate(pool, {
      title: 'An interesting topic#1',
      createdBy: userId,
      boardList: 'ACCEPTED',
      tagIds: [historyTagId, communityTagId],
    });
    await createDebate(pool, {
      title: 'An interesting topic#2',
      createdBy: userId,
      boardList: 'ACCEPTED',
      tagIds: [historyTagId],
    });
    await createDebate(pool, {
      title: 'An interesting topic#3',
      createdBy: userId,
      boardList: 'ACCEPTED',
      tagIds: [communityTagId, healthTagId],
    });
    await createDebate(pool, {
      title: 'Pending topic',
      createdBy: userId,
      boardList: 'PENDING',
      tagIds: [healthTagId],
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('returns only accepted debates', async () => {
    const debates = await service.getAll();

    expect(debates).toHaveLength(3);
    expect(debates.map(d => d.title)).toEqual([
      'An interesting topic#1',
      'An interesting topic#2',
      'An interesting topic#3',
    ]);
  });

  it('filters debates by free-text query', async () => {
    const debates = await service.getAll({
      queryStr: 'topic#2',
    });

    expect(debates).toHaveLength(1);
    expect(debates[0].title).toBe('An interesting topic#2');
  });

  it('filters debates by tags using any matching', async () => {
    const debates = await service.getAll({
      tags: {
        values: '2,3',
        matchingStrategy: TagsMatchingStrategy.ANY,
      },
    });

    expect(debates.map(d => d.title)).toEqual([
      'An interesting topic#1',
      'An interesting topic#3',
    ]);
  });

  it('filters debates by tags using all matching', async () => {
    const debates = await service.getAll({
      tags: {
        values: '2,3',
        matchingStrategy: TagsMatchingStrategy.ALL,
      },
    });

    expect(debates).toHaveLength(1);
    expect(debates[0].title).toBe('An interesting topic#3');
  });

});
