import { Inject, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Pool } from "pg";
import IORedis from "ioredis";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import {
  NOTIFICATION_QUEUE,
  NotificationJobPayload,
  NotificationMessage,
} from "@decentdebates/shared-types";
import { REDIS_PUBLISHER_TOKEN } from "./redis-publisher.module";

const NOTIFICATIONS_CHANNEL = "notifications";

@Processor(NOTIFICATION_QUEUE, {
  concurrency: 5,
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
    @Inject(REDIS_PUBLISHER_TOKEN) private publisher: IORedis,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    const { data } = job;

    if (data.kind === "generic-moderator") {
      await this.insertForAllModerators(data);
    } else {
      await this.insertForRecipient(data);
    }

    const msg: NotificationMessage =
      data.kind === "generic-moderator"
        ? { kind: "generic-moderator" }
        : { kind: "ticket-participant", recipientId: data.recipientId };

    await this.publisher.publish(NOTIFICATIONS_CHANNEL, JSON.stringify(msg));
  }

  private async insertForAllModerators(
    data: Extract<NotificationJobPayload, { kind: "generic-moderator" }>,
  ) {
    const sql = `
      insert into notification(title, content, recipient_id, event, is_read)
      select $1, $2, u.id, $3, false
      from "user" u
      where u.role = 'MODERATOR'
    `;
    const client = await this.pool.connect();
    try {
      await client.query(sql, [data.title, data.content, data.notificationEvent]);
    } finally {
      client.release();
    }
  }

  private async insertForRecipient(
    data: Extract<NotificationJobPayload, { kind: "ticket-participant" }>,
  ) {
    const sql = `
      insert into notification(title, content, recipient_id, event, is_read)
      values ($1, $2, $3, $4::notification_event, false)
    `;
    const client = await this.pool.connect();
    try {
      await client.query(sql, [
        data.title,
        data.content,
        data.recipientId,
        data.notificationEvent,
      ]);
    } finally {
      client.release();
    }
  }
}
