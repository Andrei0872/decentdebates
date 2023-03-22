import { Comment } from "@/types/comment";
import { api } from "."

const ROOT_PATH = '/comment';

export const fetchTicketComments = (ticketId: string): Promise<Comment[]> => {
  return api.get(`${ROOT_PATH}/${ticketId}`)
    .then(r => r.data.data);
}