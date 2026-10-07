import type { Queue } from "bullmq";
import {
  NOTIFICATION_JOB,
  NotificationEvents,
  NotificationJobPayload,
} from "@decentdebates/shared-types";
import { runWithRequestId } from "src/request-context";
import { enqueueNotification } from "./notification-queue";

const payload: NotificationJobPayload = {
  kind: "generic-moderator",
  title: "t",
  content: "c",
  notificationEvent: NotificationEvents.DEBATE,
};

function createQueue() {
  return { add: jest.fn().mockResolvedValue(undefined) };
}

describe("enqueueNotification", () => {
  it("attaches the current request ID to the job", async () => {
    const queue = createQueue();

    await runWithRequestId("req-1", async () => {
      // Crosses an async boundary, like the fire-and-forget call sites.
      await Promise.resolve();
      await enqueueNotification(queue as unknown as Queue, payload);
    });

    expect(queue.add).toHaveBeenCalledWith(NOTIFICATION_JOB, {
      ...payload,
      meta: { requestId: "req-1" },
    });
  });

  it("enqueues without a request ID outside of a request", async () => {
    const queue = createQueue();

    await enqueueNotification(queue as unknown as Queue, payload);

    expect(queue.add).toHaveBeenCalledWith(NOTIFICATION_JOB, {
      ...payload,
      meta: { requestId: undefined },
    });
  });
});
