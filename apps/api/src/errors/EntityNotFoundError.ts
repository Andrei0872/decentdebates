import { HttpException, HttpStatus } from "@nestjs/common";

export class EntityNotFoundError extends HttpException {
  constructor (entityName: string) {
    super(`Entity ${entityName} not found.`, HttpStatus.NOT_FOUND);
  }
}