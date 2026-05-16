import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { Subject } from "rxjs";
import { NotificationMessage } from "@decentdebates/shared-types";
import { UserRoles } from "../user/user.model";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

function makeController(subject: Subject<NotificationMessage>) {
  const mockService = {
    getUnreadCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    notifications$: subject.asObservable(),
    markNotificationsAsRead: jest.fn(),
  } as unknown as NotificationService;

  return new NotificationController(mockService);
}

function makeRequest(user: { id: number; role: UserRoles }) {
  return {
    session: { user },
    on: jest.fn(),
    off: jest.fn(),
  } as any;
}

async function collectEmissionsAfterPush(
  controller: NotificationController,
  req: any,
  subject: Subject<NotificationMessage>,
  msg: NotificationMessage,
): Promise<any[]> {
  const emissions: any[] = [];
  const sub = controller
    .notificationCount(req)
    .subscribe((v) => emissions.push(v));

  // allow the initial getUnreadCount promise to resolve
  await Promise.resolve();

  subject.next(msg);
  sub.unsubscribe();

  return emissions;
}

describe("NotificationController — SSE filter", () => {
  let subject: Subject<NotificationMessage>;
  let controller: NotificationController;

  beforeEach(() => {
    subject = new Subject<NotificationMessage>();
    controller = makeController(subject);
  });

  describe("generic-moderator message", () => {
    const msg: NotificationMessage = { kind: "generic-moderator" };

    it("streams to a moderator", async () => {
      const req = makeRequest({ id: 1, role: UserRoles.MODERATOR });
      const emissions = await collectEmissionsAfterPush(
        controller,
        req,
        subject,
        msg,
      );

      // index 0 = initial unread count (see `mockService`), index 1 = notification push
      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual({ data: { unreadCount: 1 } });
    });

    it("does not stream to a regular user", async () => {
      const req = makeRequest({ id: 1, role: UserRoles.USER });
      const emissions = await collectEmissionsAfterPush(
        controller,
        req,
        subject,
        msg,
      );

      expect(emissions.length).toBe(1); // only the initial count
    });
  });

  describe("ticket-participant message", () => {
    const recipientId = 42;
    const msg: NotificationMessage = {
      kind: "ticket-participant",
      recipientId,
    };

    it("streams to the matching recipient", async () => {
      const req = makeRequest({ id: recipientId, role: UserRoles.USER });
      const emissions = await collectEmissionsAfterPush(
        controller,
        req,
        subject,
        msg,
      );

      expect(emissions.length).toBe(2);
      expect(emissions[1]).toEqual({ data: { unreadCount: 1 } });
    });

    it("does not stream to a different user", async () => {
      const req = makeRequest({ id: 99, role: UserRoles.USER });
      const emissions = await collectEmissionsAfterPush(
        controller,
        req,
        subject,
        msg,
      );

      expect(emissions.length).toBe(1);
    });
  });
});
