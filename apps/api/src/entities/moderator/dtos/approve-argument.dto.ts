import { IsNumber, IsString } from "class-validator";

export class ApproveArgumentDTO {
  @IsNumber()
  debateId: number;

  @IsString()
  debateTitle: string;

  @IsNumber()
  argumentId: number;

  @IsString()
  argumentTitle: string;
}