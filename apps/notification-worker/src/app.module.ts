import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DbModule } from "@decentdebates/db";
import { createLoggerModuleParams, LoggerModule } from "@decentdebates/logging";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";
import { NotificationModule } from "./notification/notification.module";
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
    }),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE }),
    NotificationModule,
  ],
})
export class AppModule {}
