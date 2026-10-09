import type { Telemetry } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import { isTelemetryEnabled } from "./init";

export function createBullMqTelemetry(): Telemetry | undefined {
  if (!isTelemetryEnabled()) {
    return undefined;
  }
  return new BullMQOtel({
    tracerName: "bullmq",
    meterName: "bullmq",
    enableMetrics: true,
  });
}
