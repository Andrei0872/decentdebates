import { HttpException, HttpStatus } from "@nestjs/common";
import { describe, expect, it } from "@jest/globals";
import { DebateDraftPipe } from "./debate-draft.pipe";

describe("DebateDraftPipe", () => {
  const pipe = new DebateDraftPipe();

  it("returns the params when both ids are numeric", () => {
    const value = {
      debateId: "12",
      draftId: "34",
    };

    expect(pipe.transform(value, {} as never)).toBe(value);
  });

  it("throws when debateId is not numeric", () => {
    try {
      pipe.transform({ debateId: "abc", draftId: "34" }, {} as never);
      throw new Error("Expected transform to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as HttpException).message).toBe(
        `'debateId' is expected to be a number.`,
      );
    }
  });

  it("throws when draftId is not numeric", () => {
    try {
      pipe.transform({ debateId: "12", draftId: "abc" }, {} as never);
      throw new Error("Expected transform to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as HttpException).message).toBe(
        `'draftId' is expected to be a number.`,
      );
    }
  });
});
