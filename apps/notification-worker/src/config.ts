import { z } from "zod";
import { loadEnv, parseEnv, redisUrl } from "@decentdebates/config";

loadEnv(__dirname);

const workerSchema = z.object({
  REDIS_QUEUE_URL: redisUrl,
});

export const config = parseEnv(workerSchema);
