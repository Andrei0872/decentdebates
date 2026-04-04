import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { Pool, type PoolConfig } from 'pg';
import { seed as seedDebates } from '../../../../packages/db/data/seeds/03_debates';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const DB_ENV_FILE = path.resolve(REPO_ROOT, 'packages/db/.env');
const API_ENV_FILE = path.resolve(REPO_ROOT, 'apps/api/.env');
const API_TEST_ENV_FILE = path.resolve(REPO_ROOT, 'apps/api/.env.test');
const SCHEMA_FILE = path.resolve(REPO_ROOT, 'packages/db/schema.sql');
const DB_PACKAGE_JSON = path.resolve(REPO_ROOT, 'packages/db/package.json');
const requireFromDbPackage = createRequire(DB_PACKAGE_JSON);

let envLoaded = false;

function createKnexClient(config: PoolConfig) {
  const knexFactory = requireFromDbPackage('knex') as (options: Record<string, unknown>) => {
    destroy: () => Promise<void>;
  };

  return knexFactory({
    client: 'pg',
    connection: config,
  });
}

function maybeLoadEnv(pathname: string, override = false) {
  if (!fs.existsSync(pathname)) {
    return;
  }

  const lines = fs.readFileSync(pathname, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function loadTestEnv() {
  if (envLoaded) {
    return;
  }

  maybeLoadEnv(DB_ENV_FILE);
  maybeLoadEnv(API_ENV_FILE);
  maybeLoadEnv(API_TEST_ENV_FILE, true);

  const baseDbName = process.env.POSTGRES_DB ?? 'decentdebates';
  process.env.POSTGRES_DB = process.env.POSTGRES_DB_TEST ?? `${baseDbName}_test`;
  process.env.COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'test-cookie-secret';

  envLoaded = true;
}

export function getTestDatabaseName() {
  loadTestEnv();

  return process.env.POSTGRES_DB as string;
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

export function createAdminPool() {
  return new Pool(getConnectionConfig('postgres'));
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

export async function applySchema() {
  const pool = createTestPool();
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');

  try {
    await pool.query(schemaSql);
  } finally {
    await pool.end();
  }
}

export async function runSeeds() {
  const db = createKnexClient(getConnectionConfig(getTestDatabaseName()));

  try {
    await seedDebates(db as never);
  } finally {
    await db.destroy();
  }
}

export async function resetTestDatabase() {
  loadTestEnv();
  await recreateTestDatabase();
  await applySchema();
  await runSeeds();
}

export async function queryOne<T = Record<string, unknown>>(sql: string, values: unknown[] = []) {
  const pool = createTestPool();

  try {
    const res = await pool.query(sql, values);
    return res.rows[0] as T | undefined;
  } finally {
    await pool.end();
  }
}
