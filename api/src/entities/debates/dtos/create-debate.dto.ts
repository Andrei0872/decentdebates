import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateDebateDTO {
  @IsString()
  title: string;

  @IsArray()
  tagsIds: number[];

  @IsArray()
  @IsOptional()
  createdTags: string[];
}