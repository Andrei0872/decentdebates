import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { registerQueueDepthMetrics } from "@decentdebates/telemetry";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";

@Injectable()
export class QueueMetricsProvider implements OnModuleInit, OnModuleDestroy {
  private unregister?: () => void;

  constructor(@InjectQueue(NOTIFICATION_QUEUE) private queue: Queue) {}

  onModuleInit() {
    this.unregister = registerQueueDepthMetrics([this.queue]);
  }

  // Must run before BullMQ closes the queue (`onApplicationShutdown`).
  onModuleDestroy() {
    this.unregister?.();
  }
}
