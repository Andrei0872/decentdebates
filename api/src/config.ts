// Decided to use this file over adding values to the `api`'s `.env` file
// because some of these values are required in decorators and I thought
// it is not worth spending the time on how to inject those values there.
// Examples: `redis.module.ts`, `review.gateway.ts`.

// On other environments except `DEV`, it is expected that this app
// will be containerized.

export const config = {
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  REDIS_HOST: process.env.REDIS_HOST ?? 'localhost',
}