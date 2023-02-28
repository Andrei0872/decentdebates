import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateArgumentDTO {
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