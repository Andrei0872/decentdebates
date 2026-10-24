import { dbConfig } from "./src/config";
import { MIGRATIONS_CONFIG } from "./src/migrate";
import { SEEDS_CONFIG } from "./src/seed";

export default {
  client: "pg",
  migrations: MIGRATIONS_CONFIG,
  seeds: SEEDS_CONFIG,
  connection: dbConfig,
};
