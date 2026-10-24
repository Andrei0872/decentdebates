import { createClient } from "redis";
import { config } from "../../src/config";
import { assertTestEnv } from "./db";

export async function flushTestRedis() {
  assertTestEnv();

  const urls = [
    config.REDIS_SESSIONS_URL,
    config.REDIS_QUEUE_URL,
    config.REDIS_CACHE_URL,
  ];

  await Promise.all(
    urls.map(async (url) => {
      const client = createClient({ url });
      await client.connect();

      try {
        await client.flushAll();
      } finally {
        await client.close();
      }
    }),
  );
}
