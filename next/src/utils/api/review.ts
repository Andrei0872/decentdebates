import { ArgumentAsModerator, ArgumentAsUser, DebateAsModerator, DebateAsUser, ReviewItemType } from "@/types/review";
import { api } from ".";

export interface ModeratorDebateResponse {
  debate: DebateAsModerator;
}

export interface UserDebateResponse {
  debate: DebateAsUser;
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

export const fetchDebateAsUser = (ticketId: string): Promise<UserDebateResponse> => {
  return api.get(`${ROOT_PATH}/user/debate/${ticketId}`)
    .then(r => r.data)
    .then(r => {
      r.debate.reviewItemType = ReviewItemType.USER;

      return r;
    })
}

export const fetchArgumentAsUser = (ticketId: string): Promise<ArgumentAsUser> => {
  return api.get(`${ROOT_PATH}/user/argument/${ticketId}`)
    .then(r => r.data.data)
    .then(r => ({ ...r, reviewItemType: ReviewItemType.USER }))
}