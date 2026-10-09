import {
  ROOT_CONTEXT,
  SpanKind,
  TraceFlags,
  trace,
  type Context,
} from "@opentelemetry/api";
import { SamplingDecision } from "@opentelemetry/sdk-trace-base";
import { DropIdleWorkerSpansSampler } from "./sampler";

const TRACE_ID = "0af7651916cd43dd8448eb211c80319c";

function withSampledParent(): Context {
  return trace.setSpanContext(ROOT_CONTEXT, {
    traceId: TRACE_ID,
    spanId: "b7ad6b7169203331",
    traceFlags: TraceFlags.SAMPLED,
  });
}

function decide(spanName: string, ctx: Context = ROOT_CONTEXT) {
  return new DropIdleWorkerSpansSampler().shouldSample(
    ctx,
    TRACE_ID,
    spanName,
    SpanKind.INTERNAL,
    {},
    [],
  ).decision;
}

describe("DropIdleWorkerSpansSampler", () => {
  it.each(["getNextJob notifications", "moveStalledJobsToWait notifications"])(
    "drops root BullMQ housekeeping spans (%s)",
    (name) => {
      expect(decide(name)).toBe(SamplingDecision.NOT_RECORD);
    },
  );

  it("keeps BullMQ housekeeping spans that belong to a job's trace", () => {
    expect(decide("getNextJob notifications", withSampledParent())).toBe(
      SamplingDecision.RECORD_AND_SAMPLED,
    );
  });

  it("samples other root spans", () => {
    expect(decide("GET /api/debates")).toBe(
      SamplingDecision.RECORD_AND_SAMPLED,
    );
  });
});
