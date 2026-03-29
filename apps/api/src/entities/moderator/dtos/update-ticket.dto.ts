import { IsString } from "class-validator";

export class UpdateTicketDTO {
  @IsString()
  boardList: string;
}