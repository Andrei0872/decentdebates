import * as path from "path";
import { Pool, type PoolConfig } from "pg";
import { z } from "zod";
import { readEnvFile } from "@decentdebates/config";
import { dbConfig, migrateLatest, runSeeds } from "@decentdebates/db";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const TEST_ENV_FILES = [
  path.resolve(REPO_ROOT, "packages/db/.env.test"),
  path.resolve(REPO_ROOT, "apps/api/.env.test"),
];

// Checked on the `.env.test` files alone: a key missing there would fall back
// to the dev value in `.env`, and the tests would wipe the dev instances.
const testEnvSchema = z.object({
  POSTGRES_PORT: z.string().regex(/^\d+$/, "Expected a port number"),
  POSTGRES_DB: z.string().min(1),
  REDIS_SESSIONS_URL: z.url(),
  REDIS_QUEUE_URL: z.url(),
  REDIS_CACHE_URL: z.url(),
});

let envChecked = false;

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function assertTestEnv() {
  if (envChecked) {
    return;
  }

  const testEnv = Object.assign({}, ...TEST_ENV_FILES.map(readEnvFile));
  const result = testEnvSchema.safeParse(testEnv);
  if (!result.success) {
    throw new Error(
      `Invalid ${TEST_ENV_FILES.join(" + ")}:\n${z.prettifyError(result.error)}`,
    );
  }

  envChecked = true;
}

export function getTestDatabaseName() {
  assertTestEnv();

  return dbConfig.database;
}

function getConnectionConfig(database: string): PoolConfig {
  assertTestEnv();

  return { ...dbConfig, database };
}

export function createAdminPool() {
  return new Pool(getConnectionConfig("postgres"));
}

export function createTestPool() {
  return new Pool(getConnectionConfig(getTestDatabaseName()));
}

export async function recreateTestDatabase() {
  const adminPool = createAdminPool();
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

export async function resetTestDatabase() {
  await recreateTestDatabase();
  await runMigrations();
  await runSeeds(getConnectionConfig(getTestDatabaseName()));
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
) {
  const pool = createTestPool();

  try {
    const res = await pool.query(sql, values);
    return res.rows[0] as T | undefined;
  } finally {
    await pool.end();
  }
}
