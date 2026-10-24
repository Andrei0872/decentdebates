import { z } from "zod";
import { loadEnv, parseEnv, port } from "@decentdebates/config";

loadEnv(__dirname);

const dbSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: port,
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
});

const env = parseEnv(dbSchema);

export const dbConfig = {
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
};
