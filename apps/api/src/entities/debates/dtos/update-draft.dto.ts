import { IsString, IsNumber, IsOptional } from "class-validator";

export class UpdateDraftDTO {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  argumentType: string;

  @IsNumber()
  @IsOptional()
  counterargumentId: number;
}