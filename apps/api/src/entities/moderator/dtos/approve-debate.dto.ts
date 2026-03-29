import { IsNumber, IsString } from "class-validator";

export class ApproveDebateDTO {
  @IsNumber()
  debateId: number;

  @IsString()
  debateTitle: string;
}