import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { ArgumentTicketApproved, ArgumentTicketCreated, ArgumentUpdated, DebateTicketApproved, DebateTicketCreated, DebateTitleUpdated } from '../debates/debate.events';
import { ArgumentReviewNewComment, DebateReviewNewComment } from '../review/review.events';
import { UserCookieData } from '../user/user.model';
import { NewGenericModeratorNotification, NewNotificationToOtherTicketParticipant, Notification, NotificationEvents } from './notificatin.model';
import { NotificationsReadEvent } from './notification.events';

@Injectable()
export class NotificationService implements OnModuleDestroy, OnModuleInit {
  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
    private eventEmitter: EventEmitter2
  ) { }

  onModuleInit() {
    this.eventEmitter.on(DebateTicketCreated.EVENT_NAME, async (ev: DebateTicketCreated) => {
      const newNotif: NewGenericModeratorNotification = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.DEBATE,
      };

      this.addGenericModeratorNotifications(newNotif)
        .catch();
    });

    this.eventEmitter.on(ArgumentTicketCreated.EVENT_NAME, async (ev: ArgumentTicketCreated) => {
      const newNotif: NewGenericModeratorNotification = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.ARGUMENT,
      };

      this.addGenericModeratorNotifications(newNotif)
        .catch();
    });

    this.eventEmitter.on(DebateReviewNewComment.EVENT_NAME, async (ev: DebateReviewNewComment) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.DEBATE,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.user.id,
        ev.ticketId,
        notif
      )
        .catch();
    });

    this.eventEmitter.on(ArgumentReviewNewComment.EVENT_NAME, async (ev: ArgumentReviewNewComment) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.ARGUMENT,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.user.id,
        ev.ticketId,
        notif
      )
        .catch();
    });

    this.eventEmitter.on(DebateTitleUpdated.EVENT_NAME, async (ev: DebateTitleUpdated) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.DEBATE,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.user.id,
        ev.ticketId,
        notif
      )
        .catch();
    });

    this.eventEmitter.on(ArgumentUpdated.EVENT_NAME, async (ev: ArgumentUpdated) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.ARGUMENT,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.user.id,
        ev.ticketId,
        notif
      )
        .catch();
    });

    this.eventEmitter.on(DebateTicketApproved.EVENT_NAME, async (ev: DebateTicketApproved) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.DEBATE,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.senderId,
        ev.ticketId,
        notif
      )
        .catch();
    });

    this.eventEmitter.on(ArgumentTicketApproved.EVENT_NAME, async (ev: ArgumentTicketApproved) => {
      const notif: NewNotificationToOtherTicketParticipant = {
        content: await ev.getContent(),
        title: ev.getTitle(),
        isRead: false,
        notificationEvent: NotificationEvents.ARGUMENT,
      };

      this.addNotificationToOtherTicketParticipant(
        ev.senderId,
        ev.ticketId,
        notif
      )
        .catch();
    });
  }

  onModuleDestroy() {
    this.eventEmitter.removeAllListeners(DebateTicketCreated.EVENT_NAME);
    this.eventEmitter.removeAllListeners(ArgumentTicketCreated.EVENT_NAME);
    this.eventEmitter.removeAllListeners(DebateReviewNewComment.EVENT_NAME);
    this.eventEmitter.removeAllListeners(ArgumentReviewNewComment.EVENT_NAME);
    this.eventEmitter.removeAllListeners(DebateTitleUpdated.EVENT_NAME);
    this.eventEmitter.removeAllListeners(ArgumentUpdated.EVENT_NAME);
    this.eventEmitter.removeAllListeners(DebateTicketApproved.EVENT_NAME);
    this.eventEmitter.removeAllListeners(ArgumentTicketApproved.EVENT_NAME);
  }

  async getAll(user: UserCookieData): Promise<Notification[]> {
    const sqlStl = `
      select
        id,
        title,
        content,
        recipient_id "recipientId",
        event "notificationEvent",
        is_read "isRead"
      from notification
      where recipient_id = $1
      order by id desc
    `;
    const values = [user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStl, values);

      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }

  }

  async getUnreadCount(user: UserCookieData): Promise<number> {
    const sqlStl = `
      select count(*) "unreadCount"
      from notification
      where recipient_id = $1 and is_read = false;
    `;
    const values = [user.id];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStl, values);

      return res.rows[0].unreadCount;
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  @OnEvent('notifications.read', { async: true })
  handleNotificationsRead(payload: NotificationsReadEvent) {
    const { notifIds } = payload;

    this.markNotificationsAsRead(notifIds);
  }

  async markNotificationsAsRead(notifIds: number[]) {
    const sqlStl = `
      update notification
      set is_read = true
      where id = any($1::int[])
    `;
    const values = [notifIds];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStl, values);
      if (!res.rowCount) {
        throw new Error('No notifications updated.');
      }
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  // The logic here is that a ticket creates a 'connection' between
  // a user and a moderator. So, by having the `senderId` and a `ticketId`,
  // we can determine the other participant, and that will the recipient.
  async addNotificationToOtherTicketParticipant(senderId: number, ticketId: number, notif: NewNotificationToOtherTicketParticipant) {
    const sqlStl = `
      insert into notification(title, content, recipient_id, event)
      select distinct
        $1,
        $2,
        case
          when t.assigned_to = $3 then t.created_by
          when t.created_by = $4 then t.assigned_to
        end "recipient_id",
        $5::notification_event
      from ticket t
      where t.id = $6;
    `;
    const values = [
      notif.title,
      notif.content,
      senderId,
      senderId,
      notif.notificationEvent,
      ticketId
    ];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStl, values);
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  // Adding the same notification to all moderators.
  // Cases: a new ticket has been created - all moderators should be
  // notified.
  async addGenericModeratorNotifications(notif: NewGenericModeratorNotification) {
    const sqlStl = `
      insert into notification(title, content, recipient_id, event, is_read)
      select
        $1,
        $2,
        u.id,
        $3,
        false
      from "user" u
      where u.role = 'MODERATOR'
    `;
    const values = [
      notif.title,
      notif.content,
      notif.notificationEvent,
    ];

    const client = await this.pool.connect();
    try {
      const res = await client.query(sqlStl, values);
    } catch (err) {
      console.error(err.message);
      throw err;
    } finally {
      client.release();
    }
  }
}
