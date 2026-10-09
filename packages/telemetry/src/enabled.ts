export function isTelemetryEnabledByEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.JEST_WORKER_ID !== undefined || env.NODE_ENV === "test") {
    return false;
  }

  const disabled = env.OTEL_SDK_DISABLED?.trim().toLowerCase();
  if (disabled === "true") {
    return false;
  }
  if (disabled === "false") {
    return true;
  }

  return env.NODE_ENV === "production";
}
