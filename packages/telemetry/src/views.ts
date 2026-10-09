import {
  AggregationType,
  createAllowListAttributesProcessor,
  type ViewOptions,
} from "@opentelemetry/sdk-metrics";

export const METRIC_VIEWS: ViewOptions[] = [
  {
    meterName: "@opentelemetry/instrumentation-http",
    instrumentName: "http.server.request.duration",
    attributesProcessors: [
      createAllowListAttributesProcessor([
        "http.request.method",
        "http.route",
        "http.response.status_code",
        "error.type",
      ]),
    ],
  },
  {
    meterName: "@opentelemetry/instrumentation-pg",
    instrumentName: "db.client.connection.*",
    aggregation: { type: AggregationType.DROP },
  },
];
