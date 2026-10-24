import { z } from "zod";

export const nodeEnv = z
  .enum(["development", "production", "test"])
  .default("development");

export const port = z.coerce.number().int().min(1).max(65535);

export const redisUrl = z.url({ protocol: /^rediss?$/ });
