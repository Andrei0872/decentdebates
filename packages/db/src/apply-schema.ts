import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const DB_ENV_FILE = path.resolve(REPO_ROOT, "packages/db/.env");
const API_TEST_ENV_FILE = path.resolve(REPO_ROOT, "apps/api/.env.test");
const SCHEMA_FILE = path.resolve(__dirname, "../../schema.sql");

function maybeLoadEnv(pathname: string, override = false) {
  if (!fs.existsSync(pathname)) {
    return;
  }

  for (const line of fs.readFileSync(pathname, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;

    const key = trimmed.slice(0, sep).trim();
    const value = trimmed
      .slice(sep + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  maybeLoadEnv(DB_ENV_FILE);
  maybeLoadEnv(API_TEST_ENV_FILE, true);
}

async function main() {
  loadEnv();

  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  try {
    const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
    await pool.query(schema);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
