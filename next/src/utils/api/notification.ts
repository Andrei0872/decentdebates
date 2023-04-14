import { Notification } from "@/types/notification";
import { api } from ".";

const ROOT_PATH = '/notification';

export interface FetchNotificationsResponse {
  notifications: Notification[];
}
export const fetchNotifications = async (): Promise<FetchNotificationsResponse> => {
  return api.get(ROOT_PATH)
    .then(r => r.data);
}