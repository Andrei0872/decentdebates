import { HttpException, HttpStatus } from "@nestjs/common";

export class InvalidCredentialsError extends HttpException {
  constructor() {
    super("Invalid credentials.", HttpStatus.UNAUTHORIZED);
  }
}
