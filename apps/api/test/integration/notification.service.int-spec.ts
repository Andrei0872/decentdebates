import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { Pool } from "pg";
import { NotificationService } from "../../src/entities/notification/notification.service";
import {
  applySchema,
  createTestPool,
  recreateTestDatabase,
} from "../helpers/db";
import { createNotification, createUser } from "../helpers/factories";
import { getNotificationIdsForRecipient } from "../helpers/queries";

describe("NotificationService integration", () => {
  let service: NotificationService;
  let pool: Pool;
  let userId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new NotificationService(pool as never, {} as never);

    userId = await createUser(pool, {
      username: "notif-user",
      email: "notif-user@example.com",
    });

    await createNotification(pool, {
      title: "Older notification",
      content: "Older content",
      recipientId: userId,
      event: "DEBATE",
      isRead: true,
    });
    await createNotification(pool, {
      title: "Unread notification",
      content: "Unread content",
      recipientId: userId,
      event: "ARGUMENT",
      isRead: false,
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("returns notifications in descending order", async () => {
    const notifications = await service.getAll({
      id: userId,
      username: "notif-user",
      role: "USER" as never,
    });

    expect(notifications[0].title).toBe("Unread notification");
    expect(notifications[1].title).toBe("Older notification");
  });

  it("returns the unread count for the user", async () => {
    const unreadCount = await service.getUnreadCount({
      id: userId,
      username: "notif-user",
      role: "USER" as never,
    });

    expect(unreadCount).toBe("1");
  });

  it("marks notifications as read", async () => {
    const notificationIds = await getNotificationIdsForRecipient(pool, userId);

    await service.markNotificationsAsRead(notificationIds);

    const unreadCount = await service.getUnreadCount({
      id: userId,
      username: "notif-user",
      role: "USER" as never,
    });

    expect(unreadCount).toBe("0");
  });
});
