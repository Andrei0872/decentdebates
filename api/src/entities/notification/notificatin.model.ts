export enum NotificationEvents {
  ARGUMENT = 'ARGUMENT',
  DEBATE = 'DEBATE',
  SUGGESTION = 'SUGGESTION',
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  recipientId: number;
  notificationEvent: NotificationEvents;
  isRead: boolean;
}

export type NewNotification = Omit<Notification, 'id'>;

export type NewGenericModeratorNotification = Omit<Notification, 'id' | 'recipientId'>;

export type NewNotificationToOtherTicketParticipant = Omit<Notification, 'id' | 'recipientId'>;

export interface NotificationEvent {
  getContent(): Promise<string>;
  getTitle(): string;
}