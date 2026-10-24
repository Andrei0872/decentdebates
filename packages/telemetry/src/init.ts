import { hostname } from "node:os";
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_INSTANCE_ID,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { isTelemetryEnabledByEnv } from "./enabled";
import { createInstrumentations } from "./instrumentations";
import { DropIdleWorkerSpansSampler } from "./sampler";
import { withTimeout } from "./timeout";
import { METRIC_VIEWS } from "./views";

// Not exported by @opentelemetry/semantic-conventions' stable entry point.
const ATTR_DEPLOYMENT_ENVIRONMENT = "deployment.environment";

const SHUTDOWN_TIMEOUT_MS = 5_000;
const METRIC_EXPORT_INTERVAL_MS = 15_000;

let sdk: NodeSDK | undefined;
let started = false;
let shutdown: Promise<void> | undefined;

export interface InitTelemetryOptions {
  serviceName: string;
  ignoreIncomingPaths?: string[];
}

/**
 * Starts the OTel SDK (traces + metrics over OTLP). Must run before the app's
 * own modules are loaded, so it is called from each app's `instrumentation.ts`
 * (`node --require`).
 * No signal handlers: only `shutdownTelemetry()` flushes.
 */
export function initTelemetry({
  serviceName,
  ignoreIncomingPaths = [],
}: InitTelemetryOptions) {
  if (started) {
    return;
  }
  started = true;

  if (!isTelemetryEnabledByEnv()) {
    return;
  }

  // Matches the collector's scrape interval and the Prometheus datasource's
  // `timeInterval`, which `$__rate_interval` is derived from. At the SDK's 60s
  // default, rate() windows would often hold a single sample.
  process.env.OTEL_METRIC_EXPORT_INTERVAL ??= String(METRIC_EXPORT_INTERVAL_MS);

  sdk = new NodeSDK({
    serviceName,
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_INSTANCE_ID]: hostname(),
      // Set at image build time (git SHA), see the apps' Dockerfiles.
      [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION || "unknown",
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
    }),
    instrumentations: createInstrumentations({ ignoreIncomingPaths }),
    sampler: new DropIdleWorkerSpansSampler(),
    views: METRIC_VIEWS,
    // Logs go to stdout (pino) and are collected from there.
    logRecordProcessors: [],
  });

  // After `new NodeSDK()`, which installs its own console logger only when
  // `OTEL_LOG_LEVEL` is set. This one also reports errors when it isn't.
  diag.setLogger(new DiagConsoleLogger(), {
    logLevel: resolveDiagLogLevel(),
    suppressOverrideMessage: true,
  });

  sdk.start();
}

export function isTelemetryEnabled() {
  return sdk !== undefined;
}

export function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return Promise.resolve();
  }
  shutdown ??= withTimeout(sdk.shutdown(), SHUTDOWN_TIMEOUT_MS).catch((err) =>
    diag.error("OpenTelemetry SDK shutdown failed", err),
  );
  return shutdown;
}

function resolveDiagLogLevel() {
  const level = process.env.OTEL_LOG_LEVEL?.trim().toUpperCase();
  const value = level
    ? DiagLogLevel[level as keyof typeof DiagLogLevel]
    : undefined;
  return typeof value === "number" ? value : DiagLogLevel.ERROR;
}
