import { Module } from "@nestjs/common";
import { RedisModule } from "src/redis/redis.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
