import * as path from "path";
import type { PoolConfig } from "pg";

// The compiled files, like `MIGRATIONS_CONFIG`.
export const SEEDS_CONFIG = {
  directory: path.resolve(__dirname, "../data/seeds"),
  loadExtensions: [".js"],
};

export async function runSeeds(connection: PoolConfig) {
  // Lazy: the apps import this package at boot and never seed.
  const { knex } = await import("knex");
  const db = knex({ client: "pg", connection, seeds: SEEDS_CONFIG });

  try {
    await db.seed.run();
  } finally {
    await db.destroy();
  }
}
