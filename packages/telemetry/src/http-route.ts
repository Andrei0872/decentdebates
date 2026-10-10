import { context } from "@opentelemetry/api";
import { getRPCMetadata, RPCType } from "@opentelemetry/core";

/**
 * Sets the route template (e.g. `/api/debates/:id`) of the current incoming
 * HTTP request. The HTTP instrumentation reads it when the response closes, to
 * name the server span and label `http.server.request.duration`.
 */
export function setHttpRoute(route: string) {
  const rpcMetadata = getRPCMetadata(context.active());
  if (rpcMetadata?.type === RPCType.HTTP) {
    rpcMetadata.route = route;
  }
}
