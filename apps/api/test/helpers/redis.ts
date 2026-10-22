import { createClient } from "redis";
import { loadTestEnv } from "./db";

export async function flushTestRedis() {
  loadTestEnv();

  const urls = [
    process.env.REDIS_SESSIONS_URL,
    process.env.REDIS_QUEUE_URL,
    process.env.REDIS_CACHE_URL,
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
