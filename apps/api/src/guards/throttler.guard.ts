import { ExecutionContext, Injectable, Provider } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const DEFAULT_THROTTLE = { ttl: 60_000, limit: 30 };

@Injectable()
export class MutationThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== "http") {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    return SAFE_METHODS.has(req.method);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.session?.user?.id;
    return userId != null ? `user:${userId}` : `ip:${req.ip}`;
  }
}

export const THROTTLER_IMPORT = ThrottlerModule.forRoot([DEFAULT_THROTTLE]);

export const THROTTLER_GUARD_PROVIDER: Provider = {
  provide: APP_GUARD,
  useClass: MutationThrottlerGuard,
};
