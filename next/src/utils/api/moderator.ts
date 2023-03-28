import { DebateAsModerator } from "@/types/review";
import { api } from ".";

export const fetchArgument = (debateId: number, argId: number) => {
  return api.get(`moderator/debates/${debateId}/argument/${argId}`)
    .then(r => r.data.data);
}

export const fetchDebateByTicketId = (debateId: number): Promise<DebateAsModerator> => {
  return api.get(`/moderator/debate/${debateId}`)
    .then(r => r.data.debate);
}

export const approveTicket = (ticketId: string) => {
  return api.patch(`/moderator/approve/ticket/${ticketId}`)
    .then(r => r.data);
}