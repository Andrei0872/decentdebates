import { describe, expect, it } from "@jest/globals";
import { TagsMatchingStrategy } from "src/entities/debates/debates.service";
import { DebatesQueryPipe } from "./debates-query.pipe";

const encodeQuery = (query: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(query)).toString("base64");

describe("DebatesQueryPipe", () => {
  const pipe = new DebatesQueryPipe();

  it("returns null when the query is missing", () => {
    expect(pipe.transform(null, {} as never)).toBeNull();
  });

  it("returns null when the decoded query has no active filters", () => {
    expect(
      pipe.transform(encodeQuery({ queryStr: "" }), {} as never),
    ).toBeNull();
  });

  it("decodes query text and defaults tag matching to any", () => {
    const filters = pipe.transform(
      encodeQuery({
        queryStr: "topic",
        tags: "2,3",
      }),
      {} as never,
    );

    expect(filters).toEqual({
      queryStr: "topic",
      tags: {
        values: "2,3",
        matchingStrategy: TagsMatchingStrategy.ANY,
      },
    });
  });

  it("maps the all tag strategy explicitly", () => {
    const filters = pipe.transform(
      encodeQuery({
        tags: "2,3",
        tags_match: "all",
      }),
      {} as never,
    );

    expect(filters).toEqual({
      tags: {
        values: "2,3",
        matchingStrategy: TagsMatchingStrategy.ALL,
      },
    });
  });
});
