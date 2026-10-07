import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { generateRequestId, PinoLogger } from "@decentdebates/logging";
import { runWithRequestId } from "src/request-context";

@Injectable()
export class WsRequestContextInterceptor implements NestInterceptor {
  constructor(private readonly pinoLogger: PinoLogger) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestId = generateRequestId();

    // The handler runs when the observable is subscribed to, so the
    // subscription is what has to happen inside both async contexts.
    return new Observable((subscriber) =>
      runWithRequestId(requestId, () =>
        this.pinoLogger.runInContext(
          () => next.handle().subscribe(subscriber),
          { bindings: { reqId: requestId } },
        ),
      ),
    );
  }
}
