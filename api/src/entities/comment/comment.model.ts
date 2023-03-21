export interface AddCommentData {
  ticketId: number;
  content: string;
  commenterId: number;
}

export interface Comment {
  commentId: number;
  content: string;
  commenterId: number;
  createdAt: string;
  modifiedAt: string;
}