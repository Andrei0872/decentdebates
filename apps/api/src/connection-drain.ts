import type { Server, ServerResponse } from "node:http";

const drains = new WeakMap<Server, () => void>();

// `server.close()` closes only connections idle at that moment; one finishing
// a response later lingers for `keepAliveTimeout` (5s). Nest's
// `forceCloseConnections` would destroy in-flight requests instead.
export function trackConnectionsForDrain(server: Server) {
  const inFlight = new Set<ServerResponse>();
  let draining = false;

  const closeAfterResponse = (res: ServerResponse) => {
    if (!res.headersSent) {
      res.setHeader("Connection", "close");
      return;
    }
    // The socket turns idle only after Node's own 'finish' listener.
    res.once("finish", () => setImmediate(() => server.closeIdleConnections()));
  };

  server.on("request", (_req, res: ServerResponse) => {
    inFlight.add(res);
    res.once("close", () => inFlight.delete(res));
    if (draining) {
      closeAfterResponse(res);
    }
  });

  drains.set(server, () => {
    draining = true;
    inFlight.forEach(closeAfterResponse);
  });
}

export function startDrainingConnections(server: Server) {
  drains.get(server)?.();
}
