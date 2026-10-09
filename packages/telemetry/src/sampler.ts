import {
  trace,
  type Attributes,
  type Context,
  type Link,
  type SpanKind,
} from "@opentelemetry/api";
import {
  AlwaysOnSampler,
  ParentBasedSampler,
  SamplingDecision,
  type Sampler,
  type SamplingResult,
} from "@opentelemetry/sdk-trace-base";

// BullMQ workers trace their own housekeeping (polling for the next job,
// stalled-job checks). Without a job these spans have no parent and would
// show up as a new trace every few seconds. Spans of these operations that
// belong to a job (i.e. have a parent) are kept.
const IDLE_WORKER_OPERATIONS = [
  "getNextJob",
  "startStalledCheckTimer",
  "moveStalledJobsToWait",
];

export class DropIdleWorkerSpansSampler implements Sampler {
  constructor(
    private readonly delegate: Sampler = new ParentBasedSampler({
      root: new AlwaysOnSampler(),
    }),
  ) {}

  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes,
    links: Link[],
  ): SamplingResult {
    const isRoot = trace.getSpanContext(context) === undefined;
    if (isRoot && isIdleWorkerOperation(spanName)) {
      return { decision: SamplingDecision.NOT_RECORD };
    }
    return this.delegate.shouldSample(
      context,
      traceId,
      spanName,
      spanKind,
      attributes,
      links,
    );
  }

  toString() {
    return `DropIdleWorkerSpansSampler{${this.delegate.toString()}}`;
  }
}

// BullMQ names spans `${operation} ${queueName}`.
function isIdleWorkerOperation(spanName: string) {
  const operation = spanName.split(" ", 1)[0];
  return IDLE_WORKER_OPERATIONS.includes(operation);
}
