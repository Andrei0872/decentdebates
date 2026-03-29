export interface Comment {
  commentId: number;
  content: string;
  commenterId: number;
  createdAt: string;
  modifiedAt: string;
  commenterUsername: string;
}

export interface UpdateCommentData {
  commentId: number;
  content: string;
}