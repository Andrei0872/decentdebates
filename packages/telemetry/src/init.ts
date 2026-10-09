import { constants, hostname } from "node:os";
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
import { METRIC_VIEWS } from "./views";

// Not exported by @opentelemetry/semantic-conventions' stable entry point.
const ATTR_DEPLOYMENT_ENVIRONMENT = "deployment.environment";

const SHUTDOWN_TIMEOUT_MS = 5_000;

let enabled = false;
let started = false;

export interface InitTelemetryOptions {
  serviceName: string;
}

/**
 * Starts the OTel SDK (traces + metrics over OTLP). Must run before the app's
 * own modules are loaded, so it is called from each app's `instrumentation.ts`
 * (`node --require`).
 */
export function initTelemetry({ serviceName }: InitTelemetryOptions) {
  if (started) {
    return;
  }
  started = true;

  if (!isTelemetryEnabledByEnv()) {
    return;
  }

  const sdk = new NodeSDK({
    serviceName,
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_INSTANCE_ID]: hostname(),
      // Set at image build time (git SHA), see the apps' Dockerfiles.
      [ATTR_SERVICE_VERSION]: process.env.SERVICE_VERSION || "unknown",
      [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
    }),
    instrumentations: createInstrumentations(),
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
  enabled = true;
  registerShutdown(sdk);
}

export function isTelemetryEnabled() {
  return enabled;
}

function resolveDiagLogLevel() {
  const level = process.env.OTEL_LOG_LEVEL?.trim().toUpperCase();
  const value = level
    ? DiagLogLevel[level as keyof typeof DiagLogLevel]
    : undefined;
  return typeof value === "number" ? value : DiagLogLevel.ERROR;
}

// Flushes pending spans/metrics on SIGTERM/SIGINT. If something else handles
// the signal too (e.g. Nest's `enableShutdownHooks()`), that handler owns the
// exit. Otherwise the process exits as the signal would have made it, which
// also covers running as PID 1 in a container, where Node ignores SIGTERM by
// default.
function registerShutdown(sdk: NodeSDK) {
  let shutdown: Promise<void> | undefined;

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      shutdown ??= withTimeout(sdk.shutdown(), SHUTDOWN_TIMEOUT_MS).catch(
        (err) => diag.error("OpenTelemetry SDK shutdown failed", err),
      );
      void shutdown.finally(() => {
        if (process.listenerCount(signal) === 0) {
          process.exit(128 + constants.signals[signal]);
        }
      });
    });
  }
}

function withTimeout(promise: Promise<void>, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out after ${ms}ms`)),
      ms,
    );
    timer.unref();
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
