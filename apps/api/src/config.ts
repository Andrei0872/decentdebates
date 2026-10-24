import { z } from "zod";
import { loadEnv, nodeEnv, parseEnv, redisUrl } from "@decentdebates/config";

loadEnv(__dirname);

const MIN_PRODUCTION_SECRET_LENGTH = 32;

const apiSchema = z
  .object({
    NODE_ENV: nodeEnv,
    COOKIE_SECRET: z
      .string({ error: "required; set it in apps/api/.env.local" })
      .min(1),
    SESSION_COOKIE_NAME: z.string().min(1).default("sessionId"),
    // `start:prod:local` serves plain HTTP.
    SESSION_COOKIE_SECURE: z.stringbool().optional(),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    CLIENT_URL: z.url(),
    REDIS_SESSIONS_URL: redisUrl,
    REDIS_QUEUE_URL: redisUrl,
    REDIS_CACHE_URL: redisUrl,
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(30),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") {
      return;
    }

    if (
      env.COOKIE_SECRET.length < MIN_PRODUCTION_SECRET_LENGTH ||
      env.COOKIE_SECRET.toLowerCase() === "null"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["COOKIE_SECRET"],
        message: `must be at least ${MIN_PRODUCTION_SECRET_LENGTH} random characters in production (e.g. \`openssl rand -base64 32\`)`,
      });
    }
  })
  .transform((env) => ({
    ...env,
    SESSION_COOKIE_SECURE:
      env.SESSION_COOKIE_SECURE ?? env.NODE_ENV === "production",
    SWAGGER_ENABLED: env.NODE_ENV === "development",
  }));

export type ApiConfig = z.output<typeof apiSchema>;

export function parseApiConfig(
  env: Record<string, string | undefined>,
): ApiConfig {
  return parseEnv(apiSchema, env);
}

export const config = parseApiConfig(process.env);
