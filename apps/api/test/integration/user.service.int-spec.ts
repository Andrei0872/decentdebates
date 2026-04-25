import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { Pool } from "pg";
import { UserService } from "../../src/entities/user/user.service";
import {
  applySchema,
  createTestPool,
  recreateTestDatabase,
} from "../helpers/db";
import {
  createArgument,
  createDebate,
  createTag,
  createUser,
} from "../helpers/factories";
import { getDebateTicketId } from "../helpers/queries";

describe("UserService integration", () => {
  let service: UserService;
  let pool: Pool;
  let userId: number;
  let moderatorId: number;
  let acceptedDebateTicketId: number;
  let acceptedArgumentTicketId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new UserService(pool as never);

    userId = await createUser(pool, {
      username: "activity-user",
      email: "activity-user@example.com",
    });
    moderatorId = await createUser(pool, {
      username: "activity-moderator",
      email: "activity-moderator@example.com",
      role: "MODERATOR",
    });

    const historyTagId = await createTag(pool, "history");
    const communityTagId = await createTag(pool, "community");

    const acceptedDebateId = await createDebate(pool, {
      title: "Accepted debate",
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "ACCEPTED",
      tagIds: [historyTagId],
    });
    acceptedDebateTicketId = await getDebateTicketId(pool, acceptedDebateId);

    await createDebate(pool, {
      title: "Ongoing debate",
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "IN REVIEW",
      tagIds: [communityTagId],
    });

    const acceptedArgument = await createArgument(pool, {
      debateId: acceptedDebateId,
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "ACCEPTED",
      title: "Accepted argument",
      content: "Accepted argument content",
      argumentType: "PRO",
    });
    acceptedArgumentTicketId = acceptedArgument.ticketId as number;

    await createArgument(pool, {
      debateId: acceptedDebateId,
      createdBy: userId,
      title: "Draft argument",
      content: "Draft content",
      argumentType: "CON",
      ticketId: null,
      isDraft: true,
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("returns debate activity with solved and ongoing mapping", async () => {
    const debates = await service.getActivityDebates({
      id: userId,
      username: "activity-user",
      role: "USER" as never,
    });

    expect(debates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          debateTitle: "Accepted debate",
          activityList: "SOLVED",
        }),
        expect.objectContaining({
          debateTitle: "Ongoing debate",
          activityList: "ONGOING",
        }),
      ]),
    );
  });

  it("returns argument activity including draft state", async () => {
    const argumentsActivity = await service.getActivityArguments({
      id: userId,
      username: "activity-user",
      role: "USER" as never,
    });

    expect(argumentsActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          argumentTitle: "Accepted argument",
          activityList: "SOLVED",
          argumentIsDraft: false,
        }),
        expect.objectContaining({
          argumentTitle: "Draft argument",
          activityList: "ONGOING",
          argumentIsDraft: true,
        }),
      ]),
    );
  });

  it("returns the debate review view for the debate owner", async () => {
    const debate = await service.getDebateAsUser(
      { id: userId, username: "activity-user", role: "USER" as never },
      String(acceptedDebateTicketId),
    );

    expect(debate).toEqual(
      expect.objectContaining({
        ticketId: acceptedDebateTicketId,
        title: "Accepted debate",
        moderatorId,
      }),
    );
  });

  it("returns the argument review view for the argument owner", async () => {
    const argument = await service.getArgumentAsUser(
      { id: userId, username: "activity-user", role: "USER" as never },
      String(acceptedArgumentTicketId),
    );

    expect(argument).toEqual(
      expect.objectContaining({
        ticketId: acceptedArgumentTicketId,
        argumentTitle: "Accepted argument",
        moderatorId,
      }),
    );
  });
});
