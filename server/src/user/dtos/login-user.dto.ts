import { IsString } from "class-validator";

export class LoginUserDTO {
  @IsString()
  emailOrUsername: string;

  @IsString()
  password: string;
}