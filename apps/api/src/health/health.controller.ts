import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  SetMetadata,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Pool } from "pg";
import { type RedisClientType } from "redis";
import { PG_PROVIDER_TOKEN } from "@decentdebates/db";
import { REDIS_SESSIONS_CLIENT_TOKEN } from "src/redis/redis.module";

// Below probe timeouts, so a hung dependency yields 503, not a probe timeout.
const CHECK_TIMEOUT_MS = 1_000;

type CheckStatus = "up" | "down";

@ApiTags("health")
@Controller()
@SetMetadata("skipAuth", true)
export class HealthController {
  constructor(
    @Inject(PG_PROVIDER_TOKEN) private pool: Pool,
    @Inject(REDIS_SESSIONS_CLIENT_TOKEN) private sessions: RedisClientType,
  ) {}

  @Get("health")
  health() {
    return { status: "ok" };
  }

  @Get("ready")
  async ready() {
    // Only hard dependencies: the API serves requests without the cache (DB
    // fallback) and without the queue (notifications degrade).
    const [postgres, redisSessions] = await Promise.all([
      check(() => this.pool.query("select 1")),
      check(() => this.sessions.ping()),
    ]);
    const checks = { postgres, redisSessions };

    if (postgres === "down" || redisSessions === "down") {
      throw new ServiceUnavailableException({ status: "unavailable", checks });
    }
    return { status: "ok", checks };
  }
}

async function check(probe: () => Promise<unknown>): Promise<CheckStatus> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([probe(), timeout]);
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}
