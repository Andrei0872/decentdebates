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

interface ApproveDebateData {
  debateId: number;
  debateTitle: string;
}
export const approveDebate = (ticketId: string, debateData: ApproveDebateData) => {
  return api.patch(
    `/moderator/approve/debate/${ticketId}`,
    debateData
  )
    .then(r => r.data);
}

interface ApproveArgumentData {
  debateId: number;
  debateTitle: string;
  argumentId: number;
  argumentTitle: string;
}
export const approveArgument = (ticketId: string, argumentData: ApproveArgumentData) => {
  return api.patch(
    `/moderator/approve/argument/${ticketId}`,
    argumentData
  )
    .then(r => r.data);
}