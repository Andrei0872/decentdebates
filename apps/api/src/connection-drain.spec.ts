import {
  Agent,
  createServer,
  get,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import {
  startDrainingConnections,
  trackConnectionsForDrain,
} from "./connection-drain";

const CLOSE_DEADLINE_MS = 1_000;

async function startServer() {
  let onResponse!: (res: ServerResponse) => void;
  const nextResponse = new Promise<ServerResponse>((r) => (onResponse = r));
  const server = createServer((_req, res) => onResponse(res));
  // Far above CLOSE_DEADLINE_MS: only the drain lets close() finish in time.
  server.keepAliveTimeout = 30_000;
  trackConnectionsForDrain(server);
  await new Promise<void>((r) => server.listen(0, r));
  return { server, nextResponse };
}

function request(server: Server, agent: Agent) {
  const { port } = server.address() as AddressInfo;
  return new Promise<IncomingMessage>((resolve, reject) => {
    get({ port, agent }, resolve).on("error", reject);
  });
}

function closeServer(server: Server) {
  startDrainingConnections(server);
  return new Promise<void>((resolve) => server.close(() => resolve()));
}

function settlesWithin(promise: Promise<void>, ms: number) {
  return Promise.race([
    promise.then(() => true),
    new Promise<boolean>((r) => setTimeout(() => r(false), ms).unref()),
  ]);
}

describe("connection drain", () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({ keepAlive: true });
  });

  afterEach(() => {
    agent.destroy();
  });

  it("closes the connection of a response finishing after close()", async () => {
    const { server, nextResponse } = await startServer();
    const clientRes = request(server, agent);
    const res = await nextResponse;

    const closed = closeServer(server);
    res.end("done");

    expect((await clientRes).headers.connection).toBe("close");
    expect(await settlesWithin(closed, CLOSE_DEADLINE_MS)).toBe(true);
  });

  it("closes the connection of a stream whose headers were sent before close()", async () => {
    const { server, nextResponse } = await startServer();
    const clientRes = request(server, agent);
    const res = await nextResponse;
    res
      .writeHead(200, { "content-type": "text/event-stream" })
      .write("data: x\n\n");
    (await clientRes).resume();

    const closed = closeServer(server);
    res.end();

    expect(await settlesWithin(closed, CLOSE_DEADLINE_MS)).toBe(true);
  });
});
