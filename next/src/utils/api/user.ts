import { UserActivity } from "@/types/user";
import { api } from "."

export const fetchUserActivity = (): Promise<UserActivity[]> => {
  return api.get('/user/activity')
    .then(r => r.data.data);
}