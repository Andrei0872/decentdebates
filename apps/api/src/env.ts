import { z } from "zod";

const MIN_PRODUCTION_SECRET_LENGTH = 32;

const envSchema = z
  .looseObject({
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),
    COOKIE_SECRET: z.string().min(1),
    SESSION_COOKIE_NAME: z.string().min(1).default("sessionId"),
    // `start:prod:local` serves plain HTTP, where express-session silently
    // refuses to set a `Secure` cookie, so it needs an explicit `false`.
    SESSION_COOKIE_SECURE: z.stringbool().optional(),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
    CLIENT_URL: z.url().optional(),
    REDIS_HOST: z.string().min(1).optional(),
    REDIS_PORT: z.coerce.number().int().positive().optional(),
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
  }));

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
