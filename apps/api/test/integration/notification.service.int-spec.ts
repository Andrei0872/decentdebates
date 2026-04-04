import { EventEmitter2 } from '@nestjs/event-emitter';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { Pool } from 'pg';
import { NotificationEvents } from '@decentdebates/shared-types';
import { NotificationService } from '../../src/entities/notification/notification.service';
import { applySchema, createTestPool, recreateTestDatabase } from '../helpers/db';
import { createNotification, createTicket, createUser } from '../helpers/factories';
import { getNotificationIdsForRecipient, getNotificationRecipientIdsByTitle, getNotificationsByTitle } from '../helpers/queries';

describe('NotificationService integration', () => {
  let service: NotificationService;
  let pool: Pool;
  let userId: number;
  let moderatorId: number;
  let secondModeratorId: number;
  let ticketId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new NotificationService(pool as never, {} as EventEmitter2);

    userId = await createUser(pool, {
      username: 'notif-user',
      email: 'notif-user@example.com',
    });
    moderatorId = await createUser(pool, {
      username: 'notif-moderator-one',
      email: 'notif-moderator-one@example.com',
      role: 'MODERATOR',
    });
    secondModeratorId = await createUser(pool, {
      username: 'notif-moderator-two',
      email: 'notif-moderator-two@example.com',
      role: 'MODERATOR',
    });

    ticketId = await createTicket(pool, {
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: 'IN REVIEW',
    });

    await createNotification(pool, {
      title: 'Older notification',
      content: 'Older content',
      recipientId: userId,
      event: 'DEBATE',
      isRead: true,
    });
    await createNotification(pool, {
      title: 'Unread notification',
      content: 'Unread content',
      recipientId: userId,
      event: 'ARGUMENT',
      isRead: false,
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('returns notifications in descending order', async () => {
    const notifications = await service.getAll({
      id: userId,
      username: 'notif-user',
      role: 'USER' as never,
    });

    expect(notifications[0].title).toBe('Unread notification');
    expect(notifications[1].title).toBe('Older notification');
  });

  it('returns the unread count for the user', async () => {
    const unreadCount = await service.getUnreadCount({
      id: userId,
      username: 'notif-user',
      role: 'USER' as never,
    });

    expect(unreadCount).toBe('1');
  });

  it('marks notifications as read', async () => {
    const notificationIds = await getNotificationIdsForRecipient(pool, userId);

    await service.markNotificationsAsRead(notificationIds);

    const unreadCount = await service.getUnreadCount({
      id: userId,
      username: 'notif-user',
      role: 'USER' as never,
    });

    expect(unreadCount).toBe('0');
  });

  it('adds a notification to the other ticket participant', async () => {
    await service.addNotificationToOtherTicketParticipant(userId, ticketId, {
      title: 'Moderator notification',
      content: 'Moderator content',
      isRead: false,
      notificationEvent: NotificationEvents.DEBATE,
    });

    const moderatorNotifications = await getNotificationsByTitle(pool, 'Moderator notification');

    expect(moderatorNotifications).toEqual([
      {
        recipient_id: moderatorId,
        title: 'Moderator notification',
      },
    ]);
  });

  it('adds the same notification to all moderators', async () => {
    await service.addGenericModeratorNotifications({
      title: 'Global moderator notification',
      content: 'Global content',
      isRead: false,
      notificationEvent: NotificationEvents.ARGUMENT,
    });

    const recipients = await getNotificationRecipientIdsByTitle(pool, 'Global moderator notification');

    expect(recipients).toEqual([
      { recipient_id: moderatorId },
      { recipient_id: secondModeratorId },
    ]);
  });
});
