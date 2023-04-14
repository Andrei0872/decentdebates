import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_PROVIDER_TOKEN } from 'src/db/db.module';
import { UserCookieData } from '../user/user.model';

@Injectable()
export class NotificationService {
  constructor(@Inject(PG_PROVIDER_TOKEN) private pool: Pool) { }

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
}
