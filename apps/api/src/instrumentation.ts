import { initTelemetry } from "@decentdebates/telemetry";
import { PROBE_PATHS } from "./health/health.paths";

initTelemetry({ serviceName: "api", ignoreIncomingPaths: PROBE_PATHS });
