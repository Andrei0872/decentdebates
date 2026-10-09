import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { registerQueueDepthMetrics } from "@decentdebates/telemetry";
import { NOTIFICATION_QUEUE } from "@decentdebates/shared-types";

@Injectable()
export class QueueMetricsProvider implements OnModuleInit {
  constructor(@InjectQueue(NOTIFICATION_QUEUE) private queue: Queue) {}

  onModuleInit() {
    registerQueueDepthMetrics([this.queue]);
  }
}
