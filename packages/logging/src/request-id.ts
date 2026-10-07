import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export const REQUEST_ID_HEADER = "x-request-id";

// An inbound ID is reused only if it is short and made of safe characters,
// so a client can't inject arbitrary content into every log line of a request.
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

export function generateRequestId() {
  return randomUUID();
}

export function genReqId(req: IncomingMessage, res: ServerResponse) {
  const inbound = req.headers[REQUEST_ID_HEADER];
  const id =
    typeof inbound === "string" && VALID_REQUEST_ID.test(inbound)
      ? inbound
      : generateRequestId();

  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}
