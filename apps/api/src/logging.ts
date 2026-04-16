export function isTestRuntime() {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
}

export function shouldEmitRoutineLogs() {
  return !isTestRuntime();
}
