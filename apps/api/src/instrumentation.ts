// First: env files must be loaded before `initTelemetry` reads `OTEL_*`.
import "./config";
import { initTelemetry } from "@decentdebates/telemetry";
import { PROBE_PATHS } from "./health/health.paths";

initTelemetry({ serviceName: "api", ignoreIncomingPaths: PROBE_PATHS });
