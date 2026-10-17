import { metrics, type ObservableCallback } from "@opentelemetry/api";

// Structural type so this package does not need a runtime dependency on bullmq.
export interface QueueLike {
  readonly name: string;
  getJobCounts(...types: string[]): Promise<Record<string, number>>;
}

const DEPTH_STATES = ["waiting", "prioritized", "delayed", "active", "failed"];

/**
 * Reports the number of jobs per queue and state (`bullmq.queue.jobs`), read
 * from Redis each time metrics are collected. Register it in one service per
 * queue (the consumer) to avoid duplicate series.
 *
 * Unregister before the queues close: the shutdown flush collects once more.
 */
export function registerQueueDepthMetrics(queues: QueueLike[]): () => void {
  const meter = metrics.getMeter("@decentdebates/telemetry");
  const gauge = meter.createObservableGauge("bullmq.queue.jobs", {
    description: "Number of jobs in the queue by state",
    unit: "{job}",
  });

  const callback: ObservableCallback = async (result) => {
    await Promise.all(
      queues.map(async (queue) => {
        const counts = await queue.getJobCounts(...DEPTH_STATES);
        for (const state of DEPTH_STATES) {
          result.observe(counts[state] ?? 0, {
            "bullmq.queue.name": queue.name,
            "bullmq.queue.jobs.state": state,
          });
        }
      }),
    );
  };

  gauge.addCallback(callback);
  return () => gauge.removeCallback(callback);
}
