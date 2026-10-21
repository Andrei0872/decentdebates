import { ApiTags } from "@nestjs/swagger";
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { from, map } from "rxjs";
import { UserCookieData } from "../user/user.model";
import { CommentService } from "./comment.service";

@ApiTags("comment")
@Controller("comment")
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get("/:ticketId")
  async getTicketComments(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.commentService.getTicketComments(ticketId, user)).pipe(
      map((comments) => res.status(HttpStatus.OK).json({ data: comments })),
    );
  }
}
