// Decided to use this file over adding values to the `api`'s `.env` file
// because some of these values are required in decorators and I thought
// it is not worth spending the time on how to inject those values there.
// Examples: `redis.module.ts`, `review.gateway.ts`.

// On other environments except `DEV`, it is expected that this app
// will be containerized.

export const config = {
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:3000",
  REDIS_SESSIONS_URL:
    process.env.REDIS_SESSIONS_URL ?? "redis://localhost:6379",
  REDIS_QUEUE_URL: process.env.REDIS_QUEUE_URL ?? "redis://localhost:6380",
  REDIS_CACHE_URL: process.env.REDIS_CACHE_URL ?? "redis://localhost:6381",
  THROTTLE_LIMIT: Number(process.env.THROTTLE_LIMIT ?? 30),
  AUTH_THROTTLE_LIMIT: Number(process.env.AUTH_THROTTLE_LIMIT ?? 10),
  SWAGGER_ENABLED:
    Boolean(process.env.NODE_ENV) === false ||
    process.env.NODE_ENV.toLowerCase() === "development",
};
