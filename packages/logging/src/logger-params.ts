import { hostname } from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Params } from "nestjs-pino";
import {
  stdTimeFunctions,
  type Level,
  type LevelWithSilent,
  type LoggerOptions,
} from "pino";
import { genReqId } from "./request-id";
import { shouldEmitRoutineLogs } from "./runtime";

// Redaction is path-based, not a deep scan: `*.email` matches exactly one
// level of nesting. Request/response serializers below keep logged objects
// shallow so these paths cover what actually gets logged.
export const REDACT_PATHS = [
  "password",
  "*.password",
  "*.*.password",
  "email",
  "*.email",
  "*.*.email",
  "headers.cookie",
  "headers.authorization",
  "*.headers.cookie",
  "*.headers.authorization",
  'res.headers["set-cookie"]',
];

// Dev-only output.
const PRETTY_OPTIONS = {
  singleLine: true,
  ignore: "pid,hostname,service,context,req,res,responseTime",
  messageFormat:
    "{if context}[{context}] {end}{msg}" +
    "{if req.method} {req.method} {req.url} {res.statusCode} {responseTime}ms{end}",
};

// `id` is already declared on IncomingMessage by pino-http's type augmentation.
type HttpRequest = IncomingMessage & {
  route?: { path?: string };
  cacheHit?: boolean;
};

function resolveLevel(): LevelWithSilent {
  return shouldEmitRoutineLogs() ? "info" : "silent";
}

function customLogLevel(
  _req: IncomingMessage,
  res: ServerResponse,
  err?: Error,
): Level {
  if (err || res.statusCode >= 500) {
    return "error";
  }
  if (res.statusCode >= 400) {
    return "warn";
  }
  return "info";
}

// Options shared by every log line, independent of HTTP.
export function createBaseLoggerOptions({
  serviceName,
  level,
}: {
  serviceName: string;
  level: LevelWithSilent;
}): LoggerOptions {
  return {
    level,
    base: { service: serviceName, pid: process.pid, hostname: hostname() },
    timestamp: stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: { paths: REDACT_PATHS },
  };
}

export function createLoggerModuleParams({
  serviceName,
}: {
  serviceName: string;
}): Params {
  const level = resolveLevel();
  const pretty = process.env.NODE_ENV !== "production" && level !== "silent";

  return {
    pinoHttp: {
      ...createBaseLoggerOptions({ serviceName, level }),
      // `require.resolve` from this package: pino resolves a bare `target`
      // relative to the module that called `pino()` (pino-http), which can't
      // see `pino-pretty` under pnpm's strict node_modules layout.
      transport: pretty
        ? {
            target: require.resolve("pino-pretty"),
            options: PRETTY_OPTIONS,
          }
        : undefined,
      genReqId,
      // Logs emitted during a request carry only `reqId`, not the full
      // request object. The completion line still has `req` and `res`.
      quietReqLogger: true,
      customLogLevel,
      // pino-http calls this when the request starts and again when it
      // finishes. Only the second call knows the matched route template.
      customProps: (req: HttpRequest, res: ServerResponse) =>
        res.headersSent
          ? { route: req.route?.path, cacheHit: req.cacheHit }
          : {},
      serializers: {
        req: (req: { method: string; url: string }) => ({
          method: req.method,
          url: req.url,
        }),
        res: (res: { statusCode: number }) => ({
          statusCode: res.statusCode,
        }),
      },
    },
  };
}
