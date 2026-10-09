import { isTelemetryEnabledByEnv } from "./enabled";

describe("isTelemetryEnabledByEnv", () => {
  it.each([
    ["production by default", { NODE_ENV: "production" }, true],
    ["not outside production by default", {}, false],
    [
      "explicitly disabled",
      { NODE_ENV: "production", OTEL_SDK_DISABLED: "true" },
      false,
    ],
    ["explicitly enabled", { OTEL_SDK_DISABLED: "false" }, true],
    [
      "not under Jest",
      { JEST_WORKER_ID: "1", OTEL_SDK_DISABLED: "false" },
      false,
    ],
    [
      "not under NODE_ENV=test",
      { NODE_ENV: "test", OTEL_SDK_DISABLED: "false" },
      false,
    ],
  ])("is enabled: %s", (_name, env, expected) => {
    expect(isTelemetryEnabledByEnv(env as NodeJS.ProcessEnv)).toBe(expected);
  });
});
