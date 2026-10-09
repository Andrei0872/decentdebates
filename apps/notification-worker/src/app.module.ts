import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DbModule } from "@decentdebates/db";
import { createLoggerModuleParams, LoggerModule } from "@decentdebates/logging";
import { createBullMqTelemetry } from "@decentdebates/telemetry";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";
import { NotificationModule } from "./notification/notification.module";
import { QueueMetricsProvider } from "./queue-metrics.provider";
import { config } from "./config";

@Module({
  imports: [
    LoggerModule.forRoot(
      createLoggerModuleParams({ serviceName: "notification-worker" }),
    ),
    DbModule,
    BullModule.forRoot({
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      telemetry: createBullMqTelemetry(),
    }),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    NotificationModule,
  ],
  providers: [QueueMetricsProvider],
})
export class AppModule {}
