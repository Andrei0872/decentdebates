// First: env files must be loaded before `initTelemetry` reads `OTEL_*`.
import "./config";
import { initTelemetry } from "@decentdebates/telemetry";
import { PROBE_PATHS } from "./health/health.paths";
import { NOTIFICATION_COUNT_SSE_PATH } from "./entities/notification/notification.paths";

initTelemetry({
  serviceName: "api",
  // An SSE stream is one request that lasts as long as the connection, which
  // would skew HTTP latency. `app.sse.active_connections` covers it instead.
  ignoreIncomingPaths: [...PROBE_PATHS, NOTIFICATION_COUNT_SSE_PATH],
});
