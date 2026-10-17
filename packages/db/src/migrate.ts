import * as path from "path";
import type { PoolConfig } from "pg";

// The compiled files, the same ones the `migrate` container runs.
export const MIGRATIONS_CONFIG = {
  directory: path.resolve(__dirname, "../migrations"),
  loadExtensions: [".js"],
};

export async function migrateLatest(connection: PoolConfig) {
  // Lazy: the apps import this package at boot and never migrate.
  const { knex } = await import("knex");
  const db = knex({ client: "pg", connection, migrations: MIGRATIONS_CONFIG });

  try {
    await db.migrate.latest();
  } finally {
    await db.destroy();
  }
}
