import type { Instrumentation } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { RedisInstrumentation } from "@opentelemetry/instrumentation-redis";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";

// Listed explicitly instead of `auto-instrumentations-node`, which also
// enables fs, dns, net and others that only add noise here.
export function createInstrumentations(): Instrumentation[] {
  return [
    new HttpInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation({ requireParentSpan: true }),
    // ioredis: BullMQ (both apps) and the worker's publisher.
    new IORedisInstrumentation({ requireParentSpan: true }),
    // node-redis: the API's session store and pub/sub subscriber.
    new RedisInstrumentation({ requireParentSpan: true }),
    // Adds `trace_id`/`span_id`/`trace_flags` to every log line written inside
    // a span. Logs leave the process via stdout, not via the OTel logs SDK.
    new PinoInstrumentation({ disableLogSending: true }),
    // Event-loop delay/utilization, heap and GC metrics.
    new RuntimeNodeInstrumentation(),
  ];
}
