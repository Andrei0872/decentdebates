import * as fs from "fs";
import * as path from "path";
import { Pool, type PoolConfig } from "pg";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const DB_ENV_FILE = path.resolve(REPO_ROOT, "packages/db/.env");
const API_TEST_ENV_FILE = path.resolve(REPO_ROOT, "apps/api/.env.test");
const SCHEMA_FILE = path.resolve(REPO_ROOT, "packages/db/schema.sql");

let envLoaded = false;

function maybeLoadEnv(pathname: string, override = false) {
  if (!fs.existsSync(pathname)) {
    return;
  }

  const lines = fs.readFileSync(pathname, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadTestEnv() {
  if (envLoaded) return;

  maybeLoadEnv(DB_ENV_FILE);
  maybeLoadEnv(API_TEST_ENV_FILE, true);

  const baseDbName = process.env.POSTGRES_DB ?? "decentdebates";
  process.env.POSTGRES_DB =
    process.env.POSTGRES_DB_TEST ?? `${baseDbName}_test`;

  envLoaded = true;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function getConnectionConfig(database: string): PoolConfig {
  loadTestEnv();
  return {
    host: process.env.POSTGRES_HOST,
    port: +(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database,
  };
}

export function getTestDatabaseName() {
  loadTestEnv();
  return process.env.POSTGRES_DB as string;
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

export async function applySchema() {
  const pool = createTestPool();
  const schemaSql = fs.readFileSync(SCHEMA_FILE, "utf8");
  try {
    await pool.query(schemaSql);
  } finally {
    await pool.end();
  }
}
