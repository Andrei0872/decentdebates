export { NotificationEvents, Notification } from '@decentdebates/shared-types';
import type { Notification } from '@decentdebates/shared-types';

export type NewNotification = Omit<Notification, 'id'>;

export type NewGenericModeratorNotification = Omit<Notification, 'id' | 'recipientId'>;

export type NewNotificationToOtherTicketParticipant = Omit<Notification, 'id' | 'recipientId'>;

export interface NotificationEvent {
  getContent(): Promise<string>;
  getTitle(): string;
}
