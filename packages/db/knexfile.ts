import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { MIGRATIONS_CONFIG } from "./src/migrate";

const SOURCE_ENV_FILE = path.resolve(__dirname, ".env");
const DIST_ENV_FILE = path.resolve(__dirname, "../.env");
const DB_ENV_FILE = fs.existsSync(SOURCE_ENV_FILE)
  ? SOURCE_ENV_FILE
  : DIST_ENV_FILE;

dotenv.config({
  path: DB_ENV_FILE,
});

export default {
  client: "pg",
  migrations: MIGRATIONS_CONFIG,
  seeds: {
    directory: path.resolve(__dirname, "data/seeds"),
    loadExtensions: [".js"],
  },
  connection: {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
};
