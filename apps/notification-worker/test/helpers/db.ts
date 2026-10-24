import * as path from "path";
import { Pool, type PoolConfig } from "pg";
import { z } from "zod";
import { readEnvFile } from "@decentdebates/config";
import { dbConfig, migrateLatest } from "@decentdebates/db";

const DB_TEST_ENV_FILE = path.resolve(
  __dirname,
  "../../../../packages/db/.env.test",
);

// Checked on `.env.test` alone: a key missing there would fall back to the dev
// value in `.env`, and the tests would wipe the dev database.
const testEnvSchema = z.object({
  POSTGRES_PORT: z.string().regex(/^\d+$/, "Expected a port number"),
  POSTGRES_DB: z.string().min(1),
});

let envChecked = false;

function assertTestEnv() {
  if (envChecked) return;

  const result = testEnvSchema.safeParse(readEnvFile(DB_TEST_ENV_FILE));
  if (!result.success) {
    throw new Error(
      `Invalid ${DB_TEST_ENV_FILE}:\n${z.prettifyError(result.error)}`,
    );
  }

  envChecked = true;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function getConnectionConfig(database: string): PoolConfig {
  assertTestEnv();
  return { ...dbConfig, database };
}

export function getTestDatabaseName() {
  assertTestEnv();
  return dbConfig.database;
}

export function createTestPool() {
  return new Pool(getConnectionConfig(getTestDatabaseName()));
}

export async function recreateTestDatabase() {
  const adminPool = new Pool(getConnectionConfig("postgres"));
  const testDbName = getTestDatabaseName();
  const testDbIdentifier = quoteIdentifier(testDbName);

  try {
    await adminPool.query(
      `
        select pg_terminate_backend(pid)
        from pg_stat_activity
        where datname = $1 and pid <> pg_backend_pid()
      `,
      [testDbName],
    );
    await adminPool.query(`drop database if exists ${testDbIdentifier}`);
    await adminPool.query(`create database ${testDbIdentifier}`);
  } finally {
    await adminPool.end();
  }
}

export async function runMigrations() {
  await migrateLatest(getConnectionConfig(getTestDatabaseName()));
}
