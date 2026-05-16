export enum NotificationEvents {
  ARGUMENT = "ARGUMENT",
  DEBATE = "DEBATE",
  SUGGESTION = "SUGGESTION",
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  recipientId: number;
  notificationEvent: NotificationEvents;
  isRead: boolean;
}

export const NOTIFICATION_QUEUE = "notifications";
export const NOTIFICATION_JOB = "notification";

export type NotificationJobPayload =
  | {
      kind: "generic-moderator";
      title: string;
      content: string;
      notificationEvent: NotificationEvents;
    }
  | {
      kind: "ticket-participant";
      title: string;
      content: string;
      notificationEvent: NotificationEvents;
      recipientId: number;
    };

export type NotificationMessage =
  | { kind: "generic-moderator" }
  | { kind: "ticket-participant"; recipientId: number };
