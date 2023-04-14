
export enum NotificationEvents {
  ARGUMENT,
  DEBATE,
  SUGGESTION,
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  recipientId: number;
  notificationEvent: NotificationEvents;
  isRead: boolean;
}