import { Comment } from "@/types/comment";
import { api } from "."

export interface UpdateCommentResponse {
  message: string;
}

const ROOT_PATH = '/comment';

export const fetchTicketComments = (ticketId: string): Promise<Comment[]> => {
  return api.get(`${ROOT_PATH}/${ticketId}`)
    .then(r => r.data.data);
}

export const updateComment = (commentId: string, content: string): Promise<UpdateCommentResponse> => {
  return api.patch(`${ROOT_PATH}/${commentId}`, { content })
    .then(r => r.data);
}