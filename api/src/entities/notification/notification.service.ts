import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { DebateTicketCreated } from '../debates/debate.events';
import { UserCookieData } from '../user/user.model';
import { NewGenericModeratorNotification, Notification, NotificationEvents } from './notificatin.model';
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
  }

  onModuleDestroy() {
    this.eventEmitter.removeAllListeners(DebateTicketCreated.EVENT_NAME);
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
      where recipient_id = $1;
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

  async addNotification() { }

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
