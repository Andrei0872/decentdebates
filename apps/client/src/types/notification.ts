import type { Notification as SharedNotification } from "@decentdebates/shared-types";

export { NotificationEvents } from "@decentdebates/shared-types";

export type Notification = SharedNotification & {
  isMerelyRead: boolean;
};
