import { describe, expect, it } from "vitest";
import { BoardLists, BoardData, getActivityDTO } from "./get-activity.dto";

const board = (boardList: BoardLists): BoardData => ({ boardList, cards: [] });

describe("getActivityDTO", () => {
  it("orders boards as PENDING → IN REVIEW → ACCEPTED → CANCELED", () => {
    const input = [
      board(BoardLists.CANCELED),
      board(BoardLists.ACCEPTED),
      board(BoardLists.IN_REVIEW),
      board(BoardLists.PENDING),
    ];
    expect(getActivityDTO(input).map((b) => b.boardList)).toEqual([
      BoardLists.PENDING,
      BoardLists.IN_REVIEW,
      BoardLists.ACCEPTED,
      BoardLists.CANCELED,
    ]);
  });

  it("keeps an already-sorted list stable", () => {
    const input = [
      board(BoardLists.PENDING),
      board(BoardLists.IN_REVIEW),
      board(BoardLists.ACCEPTED),
      board(BoardLists.CANCELED),
    ];
    expect(getActivityDTO(input).map((b) => b.boardList)).toEqual(
      input.map((b) => b.boardList),
    );
  });

  it("handles a subset of boards without failing", () => {
    const input = [board(BoardLists.ACCEPTED), board(BoardLists.PENDING)];
    expect(getActivityDTO(input).map((b) => b.boardList)).toEqual([
      BoardLists.PENDING,
      BoardLists.ACCEPTED,
    ]);
  });
});
