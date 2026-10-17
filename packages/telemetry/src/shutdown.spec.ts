import { runShutdown } from "./shutdown";

describe("runShutdown", () => {
  const logger = { log: jest.fn(), error: jest.fn() };

  afterEach(() => jest.clearAllMocks());

  it("exits with 0 when close resolves", async () => {
    await expect(
      runShutdown({ close: () => Promise.resolve(), logger }),
    ).resolves.toBe(0);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("exits with 1 and logs when close rejects", async () => {
    await expect(
      runShutdown({
        close: () => Promise.reject(new Error("pool busy")),
        logger,
      }),
    ).resolves.toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Graceful shutdown failed: pool busy",
    );
  });

  it("exits with 1 when close outlives the timeout", async () => {
    await expect(
      runShutdown({
        close: () => new Promise(() => {}),
        logger,
        timeoutMs: 10,
      }),
    ).resolves.toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Graceful shutdown failed: timed out after 10ms",
    );
  });
});
