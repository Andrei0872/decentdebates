import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request = require('supertest');
import { closeRedisClient, closeTestApp, createTestApp } from '../helpers/app';
import { loginAsSeededModerator, loginAsSeededUser } from '../helpers/auth';

interface DebateTag {
  id: string;
  name: string;
}

interface DebateSummary {
  id: number;
  title: string;
  tags: DebateTag[];
}

interface ModeratorActivityCard {
  ticketId: number;
  debateId?: number;
  ticketTitle: string;
  boardList: string;
}

interface ModeratorActivityColumn {
  boardList: string;
  cards: ModeratorActivityCard[];
}

describe('Debate flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await closeTestApp(app);
    }

    await closeRedisClient();
  });

  it('creates, approves, and publishes a debate through the moderator workflow', async () => {
    const userAgent = await loginAsSeededUser(app);
    const moderatorAgent = await loginAsSeededModerator(app);
    const title = `E2E debate ${Date.now()}`;

    await userAgent
      .post('/api/debates')
      .send({
        title,
        tagsIds: [1],
        createdTags: ['e2e-testing'],
      })
      .expect(201);

    const moderatorActivityResponse = await moderatorAgent
      .get('/api/moderator/activity')
      .expect(200);

    const moderatorActivity = moderatorActivityResponse.body.data as ModeratorActivityColumn[];
    const pendingDebate = moderatorActivity
      .flatMap(column => column.cards)
      .find(card => card.ticketTitle === title);

    expect(pendingDebate).toEqual(
      expect.objectContaining({
        ticketTitle: title,
        boardList: 'PENDING',
      }),
    );

    await moderatorAgent
      .patch(`/api/moderator/activity/ticket/${pendingDebate!.ticketId}`)
      .send({ boardList: 'IN REVIEW' })
      .expect(204);

    await moderatorAgent
      .patch(`/api/moderator/approve/debate/${pendingDebate!.ticketId}`)
      .send({
        debateId: pendingDebate!.debateId,
        debateTitle: title,
      })
      .expect(200);

    const publicDebatesResponse = await request(app.getHttpServer())
      .get('/api/debates')
      .expect(200);

    const publicDebates = publicDebatesResponse.body.data as DebateSummary[];
    expect(publicDebates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title,
          tags: expect.arrayContaining([
            expect.objectContaining({ name: 'e2e-testing' }),
          ]),
        }),
      ]),
    );
  });
});
