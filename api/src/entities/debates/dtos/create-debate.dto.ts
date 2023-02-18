import { IsString } from "class-validator";

export class CreateDebateDTO {
  @IsString()
  title: string;

  @IsString()
  tagsIds: string;
}