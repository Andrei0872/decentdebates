import { ArgumentAsModerator, ReviewArgumentTypes } from "@/types/review";
import { api } from ".";

const ROOT_PATH = `/review`;

export const fetchArgumentAsModerator = (ticketId: string): Promise<ArgumentAsModerator> => {
  return api.get(`${ROOT_PATH}/moderator/argument/${ticketId}`)
    .then(r => r.data.data)
    .then(r => ({ ...r, reviewArgumentType: ReviewArgumentTypes.MODERATOR }))
}