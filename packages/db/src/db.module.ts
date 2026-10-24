import { FactoryProvider, Global, Logger, Module } from "@nestjs/common";
import { Pool } from "pg";
import { registerPoolMetrics } from "./pool-metrics";
import { dbConfig } from "./config";

const LOGGER_CONTEXT = "DB";

export const PG_PROVIDER_TOKEN = "PG_PROVIDER_TOKEN";

const PG_PROVIDER: FactoryProvider<Pool> = {
  provide: PG_PROVIDER_TOKEN,
  useFactory: async () => {
    const logger = new Logger(LOGGER_CONTEXT);

    const pool = new Pool(dbConfig);

    try {
      await new Promise((resolve, reject) => {
        pool.query("SELECT NOW()", (err, res) => {
          if (err) {
            return reject(err);
          }

          resolve(res);
        });
      });

      logger.log("Successfully connected to the database.");
    } catch (err) {
      logger.error("An error occurred while connecting to the database", err);
      pool.end();
      process.exit(1);
    }

    registerPoolMetrics(pool);

    return pool;
  },
};

@Global()
@Module({
  providers: [PG_PROVIDER],
  exports: [PG_PROVIDER],
})
export class DbModule {}
