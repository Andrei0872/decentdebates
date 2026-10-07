import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request } from "express";

// Per-request data the API needs outside of logging (e.g. to put the request
// ID on BullMQ jobs). nestjs-pino keeps its own store, which holds only a logger.
interface RequestContext {
  readonly requestId: string | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestId() {
  return storage.getStore()?.requestId;
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return storage.run({ requestId }, fn);
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: unknown, next: NextFunction) {
    // Read lazily: pino-http assigns `req.id`, and its middleware is not
    // guaranteed to run before this one.
    storage.run(
      {
        get requestId() {
          return req.id === undefined ? undefined : String(req.id);
        },
      },
      next,
    );
  }
}
