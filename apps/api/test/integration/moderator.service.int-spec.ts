import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { Pool } from "pg";
import { ModeratorService } from "../../src/entities/moderator/moderator.service";
import {
  applySchema,
  createTestPool,
  recreateTestDatabase,
} from "../helpers/db";
import {
  createArgument,
  createDebate,
  createTag,
  createTicket,
  createUser,
} from "../helpers/factories";
import { getDebateTicketId, getTicketState } from "../helpers/queries";

describe("ModeratorService integration", () => {
  let service: ModeratorService;
  let pool: Pool;
  let userId: number;
  let moderatorId: number;
  let secondModeratorId: number;
  let debateTicketId: number;
  let argumentTicketId: number;

  beforeAll(async () => {
    await recreateTestDatabase();
    await applySchema();

    pool = createTestPool();
    service = new ModeratorService(pool as never);

    userId = await createUser(pool, {
      username: "moderator-user",
      email: "moderator-user@example.com",
    });
    moderatorId = await createUser(pool, {
      username: "moderator-one",
      email: "moderator-one@example.com",
      role: "MODERATOR",
    });
    secondModeratorId = await createUser(pool, {
      username: "moderator-two",
      email: "moderator-two@example.com",
      role: "MODERATOR",
    });

    const historyTagId = await createTag(pool, "history");
    const healthTagId = await createTag(pool, "health");

    const debateId = await createDebate(pool, {
      title: "Moderator review debate",
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "IN REVIEW",
      tagIds: [historyTagId, healthTagId],
    });
    debateTicketId = await getDebateTicketId(pool, debateId);

    const argument = await createArgument(pool, {
      debateId,
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "IN REVIEW",
      title: "Moderator review argument",
      content: "Argument content",
      argumentType: "PRO",
    });
    argumentTicketId = argument.ticketId as number;

    const pendingDebateId = await createDebate(pool, {
      title: "Pending moderator debate",
      createdBy: userId,
      boardList: "PENDING",
      tagIds: [healthTagId],
    });
    await createArgument(pool, {
      debateId: pendingDebateId,
      createdBy: userId,
      boardList: "PENDING",
      title: "Pending moderator argument",
      content: "Pending argument",
      argumentType: "CON",
    });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("returns debate cards with board metadata", async () => {
    const debates = await service.getDebateCards();

    expect(debates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ticketTitle: "Moderator review debate",
          boardList: "IN REVIEW",
          moderatorId,
        }),
        expect.objectContaining({
          ticketTitle: "Pending moderator debate",
          boardList: "PENDING",
        }),
      ]),
    );
  });

  it("returns argument cards with debate metadata", async () => {
    const argumentsCards = await service.getArgumentCards();

    expect(argumentsCards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ticketTitle: "Moderator review argument",
          debateTitle: "Moderator review debate",
          boardList: "IN REVIEW",
        }),
      ]),
    );
  });

  it("returns the assigned debate to the moderator", async () => {
    const debate = await service.getDebateAsModerator(
      {
        id: moderatorId,
        username: "moderator-one",
        role: "MODERATOR" as never,
      },
      String(debateTicketId),
    );

    expect(debate).toEqual(
      expect.objectContaining({
        ticketId: debateTicketId,
        title: "Moderator review debate",
        boardList: "IN REVIEW",
      }),
    );
  });

  it("returns the assigned argument to the moderator", async () => {
    const argument = await service.getArgumentAsModerator(
      {
        id: moderatorId,
        username: "moderator-one",
        role: "MODERATOR" as never,
      },
      String(argumentTicketId),
    );

    expect(argument).toEqual(
      expect.objectContaining({
        ticketId: argumentTicketId,
        argumentTitle: "Moderator review argument",
        debateTitle: "Moderator review debate",
      }),
    );
  });

  it("assigns the moderator when moving a pending ticket into review", async () => {
    const pendingTicketId = await createTicket(pool, {
      createdBy: userId,
      boardList: "PENDING",
    });

    await service.updateTicket({
      userId: moderatorId,
      ticketId: String(pendingTicketId),
      ticketData: {
        boardList: "IN REVIEW",
      },
    });

    const result = await getTicketState(pool, pendingTicketId);

    expect(result).toEqual({
      board_list: "IN REVIEW",
      assigned_to: moderatorId,
    });
  });

  it("unassigns a ticket when moving it back to pending", async () => {
    const assignedTicketId = await createTicket(pool, {
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "IN REVIEW",
    });

    await service.updateTicket({
      userId: moderatorId,
      ticketId: String(assignedTicketId),
      ticketData: {
        boardList: "PENDING",
      },
    });

    const result = await getTicketState(pool, assignedTicketId);

    expect(result).toEqual({
      board_list: "PENDING",
      assigned_to: null,
    });
  });

  it("rejects updates from a moderator who does not own the ticket", async () => {
    const assignedTicketId = await createTicket(pool, {
      createdBy: userId,
      assignedTo: moderatorId,
      boardList: "IN REVIEW",
    });

    await expect(
      service.updateTicket({
        userId: secondModeratorId,
        ticketId: String(assignedTicketId),
        ticketData: {
          boardList: "ACCEPTED",
        },
      }),
    ).rejects.toThrow("An error occurred while updated the ticket.");
  });
});
