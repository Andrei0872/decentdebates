import { UserActivity, CardTypes } from "@/types/user";
import { api } from "."

export const fetchUserActivity = (): Promise<UserActivity[]> => {
  return api.get('/user/activity')
    .then(r => r.data.data)
    .then(cards => cards.map((c: any) => c.cardType === CardTypes.ARGUMENT ? c : ({ ...c, tags: c.tags.split(',') })))
}