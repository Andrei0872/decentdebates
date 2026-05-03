import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Request } from "express";

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const hit = (req as any).cacheHit;
        const cacheLabel =
          hit === true ? " [HIT]" : hit === false ? " [MISS]" : "";
        this.logger.log(
          `${req.method} ${req.url}${cacheLabel} — ${Date.now() - start}ms`,
        );
      }),
    );
  }
}
