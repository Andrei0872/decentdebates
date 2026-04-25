import { describe, expect, it } from "vitest";
import { getDebateDTO } from "./get-debate.dto";
import type {
  CurrentDebate,
  DebateArgument,
} from "@/store/slices/debates.slice";

const arg = (
  id: number,
  counterargumentTo: number | null = null,
): DebateArgument =>
  ({
    argumentId: id,
    counterargumentTo,
    counterarguments: null,
  }) as unknown as DebateArgument;

const build = (args: DebateArgument[]): CurrentDebate =>
  ({ args, metadata: { debateId: 1, debateTitle: "t" } }) as CurrentDebate;

describe("getDebateDTO", () => {
  it("returns the debate unchanged when there are no arguments", () => {
    const debate = build([]);
    expect(getDebateDTO(debate)).toBe(debate);
  });

  it("leaves counterarguments null when no argument is a counter", () => {
    const debate = build([arg(1), arg(2), arg(3)]);
    const dto = getDebateDTO(debate);
    expect(dto.args.every((a) => a.counterarguments === null)).toBe(true);
  });

  it("attaches a single counterargument", () => {
    const debate = build([arg(1), arg(2, 1)]);
    const dto = getDebateDTO(debate);
    expect(dto.args.find((a) => a.argumentId === 1)!.counterarguments).toEqual([
      2,
    ]);
    expect(
      dto.args.find((a) => a.argumentId === 2)!.counterarguments,
    ).toBeNull();
  });

  it("groups multiple counterarguments under the same parent", () => {
    const debate = build([arg(1), arg(2, 1), arg(3, 1), arg(4, 1)]);
    const dto = getDebateDTO(debate);
    expect(dto.args.find((a) => a.argumentId === 1)!.counterarguments).toEqual([
      2, 3, 4,
    ]);
  });

  it("supports multi-level trees (counters of counters)", () => {
    // 1 → {2, 3}; 2 → {4}; 4 → {5}
    const debate = build([arg(1), arg(2, 1), arg(3, 1), arg(4, 2), arg(5, 4)]);
    const dto = getDebateDTO(debate);
    const byId = Object.fromEntries(
      dto.args.map((a) => [a.argumentId, a.counterarguments]),
    );
    expect(byId).toEqual({
      1: [2, 3],
      2: [4],
      3: null,
      4: [5],
      5: null,
    });
  });

  it("preserves the original argument ordering", () => {
    const debate = build([arg(3), arg(1), arg(2, 3)]);
    const dto = getDebateDTO(debate);
    expect(dto.args.map((a) => a.argumentId)).toEqual([3, 1, 2]);
  });
});
