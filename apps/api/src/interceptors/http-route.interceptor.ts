import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { setHttpRoute } from "@decentdebates/telemetry";
import type { Request } from "express";

@Injectable()
export class HttpRouteInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() === "http") {
      const req = context.switchToHttp().getRequest<Request>();
      const route: unknown = req.route?.path;
      if (typeof route === "string") {
        setHttpRoute(route);
      }
    }
    return next.handle();
  }
}
