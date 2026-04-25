import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

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
  seeds: {
    directory: path.resolve(__dirname, "data/seeds"),
    loadExtensions: [".js"],
  },
  connection: {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
};
