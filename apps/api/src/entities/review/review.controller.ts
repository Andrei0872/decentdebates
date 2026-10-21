import { ApiTags } from "@nestjs/swagger";
import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { EntityNotFoundError } from "src/errors/EntityNotFoundError";
import { Request, Response } from "express";
import { from, map, tap } from "rxjs";
import { Roles } from "src/decorators/roles.decorator";
import { RolesGuard } from "src/guards/roles.guard";
import { ModeratorService } from "../moderator/moderator.service";
import { UserCookieData, UserRoles } from "../user/user.model";
import { UserService } from "../user/user.service";
import { ReviewService } from "./review.service";

@ApiTags("review")
@Controller("review")
export class ReviewController {
  constructor(
    private reviewService: ReviewService,
    private moderatorService: ModeratorService,
    private userService: UserService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(UserRoles.MODERATOR)
  @Get("/moderator/argument/:ticketId")
  async getArgumentAsModerator(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(
      this.moderatorService.getArgumentAsModerator(user, ticketId),
    ).pipe(
      tap((data) => {
        if (!data) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      map((data) => res.status(HttpStatus.OK).json({ data })),
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.MODERATOR)
  @Get("/moderator/debate/:ticketId")
  async getDebateAsModerator(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(
      this.moderatorService.getDebateAsModerator(user, ticketId),
    ).pipe(
      tap((data) => {
        if (!data) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      map((rawDebate) => {
        const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

        const tags = rawTags.split(",");
        const tagsIds = rawTagsIds.split(",");

        return {
          ...debate,
          debateTags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
        };
      }),
      map((debate) => res.status(HttpStatus.OK).json({ debate })),
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.USER)
  @Get("/user/debate/:ticketId")
  async getDebateAsUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.userService.getDebateAsUser(user, ticketId)).pipe(
      tap((data) => {
        if (!data) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      map((rawDebate) => {
        const { tags: rawTags, tagsIds: rawTagsIds, ...debate } = rawDebate;

        const tags = rawTags.split(",");
        const tagsIds = rawTagsIds.split(",");

        return {
          ...debate,
          tags: tags.map((t, i) => ({ id: tagsIds[i], name: t })),
        };
      }),
      map((debate) => res.status(HttpStatus.OK).json({ debate })),
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRoles.USER)
  @Get("/user/argument/:ticketId")
  async getArgumentAsUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param("ticketId", ParseIntPipe) ticketId: number,
  ) {
    const user = (req as any).session.user as UserCookieData;

    return from(this.userService.getArgumentAsUser(user, ticketId)).pipe(
      tap((data) => {
        if (!data) {
          throw new EntityNotFoundError("ticket");
        }
      }),
      map((data) => res.status(HttpStatus.OK).json({ data })),
    );
  }
}
