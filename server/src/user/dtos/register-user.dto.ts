import { IsEmail, IsString } from "class-validator";

export class RegisterUserDTO {
  @IsEmail()
  email: string;
  
  @IsString()
  username: string;

  @IsString()
  password: string;
}