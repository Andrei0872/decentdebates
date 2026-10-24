import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  scenarios: {
    smoke: {
      // Open model: requests start at a fixed rate however slow the server
      // gets, as real users would.
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "1m",
      preAllocatedVUs: 5,
    },
  },
  // Correctness only; latency targets come from the baseline.
  thresholds: {
    checks: ["rate==1"],
  },
};

export function setup() {
  const res = http.get(`${BASE_URL}/api/debates`, {
    tags: { name: "GET /api/debates" },
  });
  check(res, { "debates listed": (r) => r.status === 200 });
  const ids = res.json("data").map((d) => d.id);
  if (ids.length === 0) {
    throw new Error("No debates to read; run `pnpm run seed:load` first.");
  }
  return { ids };
}

export default function ({ ids }) {
  const id = ids[Math.floor(Math.random() * ids.length)];
  const res = http.get(`${BASE_URL}/api/debates/${id}`, {
    // One series for all ids instead of one per URL.
    tags: { name: "GET /api/debates/:id" },
  });
  check(res, { "debate read": (r) => r.status === 200 });
}
