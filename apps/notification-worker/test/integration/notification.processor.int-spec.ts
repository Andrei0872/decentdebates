import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { Job } from "bullmq";
import type { Pool } from "pg";
import {
  NotificationEvents,
  NotificationJobPayload,
  NotificationMessage,
} from "@decentdebates/shared-types";
import { NotificationProcessor } from "../../src/notification/notification.processor";
import { applySchema, createTestPool, recreateTestDatabase } from "../helpers/db";

const NOTIFICATIONS_CHANNEL = "notifications";

async function createUser(
  pool: Pool,
  data: { username: string; email: string; role?: "USER" | "MODERATOR" },
) {
  const res = await pool.query<{ id: number }>(
    `insert into "user" (username, password, email, role)
     values ($1, 'pwd', $2, $3) returning id`,
    [data.username, data.email, data.role ?? "USER"],
  );
  return res.rows[0].id;
}

async function getNotificationsByTitle(pool: Pool, title: string) {
  const res = await pool.query<{ recipient_id: number; title: string }>(
    "select recipient_id, title from notification where title = $1 order by recipient_id asc",
    [title],
  );
  return res.rows;
}

describe("NotificationProcessor integration", () => {
  let pool: Pool;
  let processor: NotificationProcessor;
  let mockPublisher: { publish: ReturnType<typeof jest.fn> };
  let moderatorOneId: number;
  let moderatorTwoId: number;
  let userId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();

    moderatorOneId = await createUser(pool, {
      username: "proc-mod-one",
      email: "proc-mod-one@example.com",
      role: "MODERATOR",
    });
    moderatorTwoId = await createUser(pool, {
      username: "proc-mod-two",
      email: "proc-mod-two@example.com",
      role: "MODERATOR",
    });
    userId = await createUser(pool, {
      username: "proc-user",
      email: "proc-user@example.com",
    });

    mockPublisher = { publish: jest.fn<() => Promise<number>>().mockResolvedValue(1) };
    processor = new NotificationProcessor(pool as never, mockPublisher as never);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  describe("generic-moderator job", () => {
    it("inserts a notification for every moderator and publishes to Redis", async () => {
      const jobData: NotificationJobPayload = {
        kind: "generic-moderator",
        title: "New debate proposed",
        content: "<rich-text>",
        notificationEvent: NotificationEvents.DEBATE,
      };
      const job = { data: jobData } as Job<NotificationJobPayload>;

      await processor.process(job);

      const rows = await getNotificationsByTitle(pool, jobData.title);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.recipient_id)).toEqual(
        expect.arrayContaining([moderatorOneId, moderatorTwoId]),
      );

      const expectedMsg: NotificationMessage = { kind: "generic-moderator" };
      expect(mockPublisher.publish).toHaveBeenCalledWith(
        NOTIFICATIONS_CHANNEL,
        JSON.stringify(expectedMsg),
      );
    });
  });

  describe("ticket-participant job", () => {
    it("inserts a notification for the specific recipient and publishes to Redis", async () => {
      mockPublisher.publish.mockClear();

      const jobData: NotificationJobPayload = {
        kind: "ticket-participant",
        title: "Argument approved",
        content: "<rich-text>",
        notificationEvent: NotificationEvents.ARGUMENT,
        recipientId: userId,
      };
      const job = { data: jobData } as Job<NotificationJobPayload>;

      await processor.process(job);

      const rows = await getNotificationsByTitle(pool, jobData.title);
      expect(rows).toHaveLength(1);
      expect(rows[0].recipient_id).toBe(userId);

      const expectedMsg: NotificationMessage = {
        kind: "ticket-participant",
        recipientId: userId,
      };
      expect(mockPublisher.publish).toHaveBeenCalledWith(
        NOTIFICATIONS_CHANNEL,
        JSON.stringify(expectedMsg),
      );
    });
  });
});
