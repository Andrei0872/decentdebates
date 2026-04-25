export { Comment, UpdateCommentData } from "@decentdebates/shared-types";

export interface AddCommentData {
  ticketId: number;
  content: string;
  commenterId: number;
}
