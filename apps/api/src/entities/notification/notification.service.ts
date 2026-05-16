import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Pool } from "pg";
import { type RedisClientType } from "redis";
import { Subject } from "rxjs";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { NotificationMessage } from "@decentdebates/shared-types";
import { REDIS_CLIENT_TOKEN } from "src/redis/redis.module";
import { UserCookieData } from "../user/user.model";
import { Notification } from "./notificatin.model";

const NOTIFICATIONS_CHANNEL = "notifications";

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private readonly _notifications$ = new Subject<NotificationMessage>();
  private subscriber: RedisClientType;

  readonly notifications$ = this._notifications$.asObservable();

  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
    @Inject(REDIS_CLIENT_TOKEN) private redis: RedisClientType,
  ) {}

  async onModuleInit() {
    this.subscriber = this.redis.duplicate() as RedisClientType;
    await this.subscriber.connect();
    await this.subscriber.subscribe(NOTIFICATIONS_CHANNEL, (raw) => {
      try {
        const msg: NotificationMessage = JSON.parse(raw);
        this._notifications$.next(msg);
      } catch {
        this.logger.error(`Failed to parse notification message: ${raw}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber.unsubscribe(NOTIFICATIONS_CHANNEL);
    await this.subscriber.disconnect();
    this._notifications$.complete();
  }

  private logError(err: unknown) {
    this.logger.error(err instanceof Error ? err.message : String(err));
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
      this.logError(err);
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
      this.logError(err);
      throw err;
    } finally {
      client.release();
    }
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
        throw new Error("No notifications updated.");
      }
    } catch (err) {
      this.logError(err);
      throw err;
    } finally {
      client.release();
    }
  }
}
