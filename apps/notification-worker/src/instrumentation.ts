// First: env files must be loaded before `initTelemetry` reads `OTEL_*`.
import "./config";
import { initTelemetry } from "@decentdebates/telemetry";

initTelemetry({ serviceName: "notification-worker" });
