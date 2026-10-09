import { metrics } from "@opentelemetry/api";
import type { Pool } from "pg";

// Pool usage read from the pool's own counters at each collection.
// Names and attributes follow the OTel database client semantic conventions.
// A no-op unless the OTel SDK was started before this runs (see
// `@decentdebates/telemetry`).
export function registerPoolMetrics(pool: Pool) {
  const meter = metrics.getMeter("@decentdebates/db");
  const { host, port, database } = pool.options;
  const poolName = `${host ?? "localhost"}:${port ?? 5432}/${database ?? ""}`;
  const base = { "db.client.connection.pool.name": poolName };

  meter
    .createObservableUpDownCounter("db.client.connection.count", {
      description: "Connections in the pool, by state (idle, used)",
      unit: "{connection}",
    })
    .addCallback((result) => {
      const idle = pool.idleCount;
      result.observe(idle, { ...base, "db.client.connection.state": "idle" });
      result.observe(pool.totalCount - idle, {
        ...base,
        "db.client.connection.state": "used",
      });
    });

  meter
    .createObservableUpDownCounter("db.client.connection.pending_requests", {
      description: "Requests waiting for a connection from the pool",
      unit: "{request}",
    })
    .addCallback((result) => result.observe(pool.waitingCount, base));

  meter
    .createObservableUpDownCounter("db.client.connection.max", {
      description: "Maximum number of connections the pool allows",
      unit: "{connection}",
    })
    .addCallback((result) => result.observe(pool.options.max, base));
}
