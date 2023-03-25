import { ArgumentAsModerator, DebateAsModerator, ReviewItemType } from "@/types/review";
import { api } from ".";

export interface ModeratorDebateResponse {
  debate: DebateAsModerator;
}

const ROOT_PATH = `/review`;

export const fetchArgumentAsModerator = (ticketId: string): Promise<ArgumentAsModerator> => {
  return api.get(`${ROOT_PATH}/moderator/argument/${ticketId}`)
    .then(r => r.data.data)
    .then(r => ({ ...r, reviewItemType: ReviewItemType.MODERATOR }))
}

export const fetchDebateAsModerator = (ticketId: string): Promise<ModeratorDebateResponse> => {
  return api.get(`${ROOT_PATH}/moderator/debate/${ticketId}`)
    .then(r => r.data)
    .then(r => {
      r.debate.reviewItemType = ReviewItemType.MODERATOR;

      return r;
    })
}