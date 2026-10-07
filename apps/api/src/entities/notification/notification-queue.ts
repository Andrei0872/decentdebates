import type { Queue } from "bullmq";
import {
  NOTIFICATION_JOB,
  NotificationJobData,
  NotificationJobPayload,
} from "@decentdebates/shared-types";
import { getRequestId } from "src/request-context";

export function enqueueNotification(
  queue: Queue,
  payload: NotificationJobPayload,
) {
  const data: NotificationJobData = {
    ...payload,
    meta: { requestId: getRequestId() },
  };
  return queue.add(NOTIFICATION_JOB, data);
}
