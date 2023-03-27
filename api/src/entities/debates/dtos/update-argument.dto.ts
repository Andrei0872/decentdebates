import { IsString } from "class-validator";

export class UpdateArgumentDTO {
  @IsString()
  title: string;

  @IsString()
  content: string;
}