import type { IncomingMessage, ServerResponse } from "node:http";
import { genReqId, REQUEST_ID_HEADER } from "./request-id";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function call(inbound?: string | string[]) {
  const headers: Record<string, string | number | string[]> = {};
  const req = {
    headers: inbound === undefined ? {} : { [REQUEST_ID_HEADER]: inbound },
  } as unknown as IncomingMessage;
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  } as unknown as ServerResponse;

  const id = genReqId(req, res);
  return { id, responseHeader: headers[REQUEST_ID_HEADER] };
}

describe("genReqId", () => {
  it("generates an ID when none is sent and returns it in the response", () => {
    const { id, responseHeader } = call();

    expect(id).toMatch(UUID);
    expect(responseHeader).toBe(id);
  });

  it("reuses a valid inbound ID", () => {
    const { id, responseHeader } = call("edge-abc_123.4");

    expect(id).toBe("edge-abc_123.4");
    expect(responseHeader).toBe("edge-abc_123.4");
  });

  it.each([
    ["too long", "a".repeat(65)],
    ["unsafe characters", 'abc"\n{"level":"error"}'],
    ["empty", ""],
    ["repeated header", ["a", "b"]],
  ])("replaces an invalid inbound ID (%s)", (_name, inbound) => {
    const { id, responseHeader } = call(inbound);

    expect(id).toMatch(UUID);
    expect(responseHeader).toBe(id);
  });
});
