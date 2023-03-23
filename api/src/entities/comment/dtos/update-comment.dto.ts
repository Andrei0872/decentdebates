import { IsString } from "class-validator";

export class UpdateCommentDTO {
  @IsString()
  content: string;
}