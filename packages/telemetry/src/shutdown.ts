import { shutdownTelemetry } from "./init";
import { withTimeout } from "./timeout";

export interface ShutdownLogger {
  log(message: string): void;
  error(message: string): void;
}

export interface ShutdownSignalOptions {
  close: () => Promise<void>;
  logger: ShutdownLogger;
  /** Plus the 5s telemetry flush, must stay under the stop grace period. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

// Not Nest's `enableShutdownHooks()`: it re-raises the signal after
// `app.close()`, leaving no room for the telemetry flush, and runs global
// modules' shutdown hooks first, so closing the DB pool -> jobs would race.
export function handleShutdownSignals(options: ShutdownSignalOptions) {
  let started = false;

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      if (started) {
        return;
      }
      started = true;
      options.logger.log(`Received ${signal}, shutting down`);
      void runShutdown(options).then((code) => process.exit(code));
    });
  }
}

export async function runShutdown({
  close,
  logger,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: ShutdownSignalOptions): Promise<number> {
  let code = 0;
  try {
    await withTimeout(close(), timeoutMs);
  } catch (err) {
    logger.error(
      `Graceful shutdown failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    code = 1;
  }

  await shutdownTelemetry();
  return code;
}
