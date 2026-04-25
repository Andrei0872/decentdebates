import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/utils/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "@/utils/api";
import {
  createArgument,
  createDebate,
  fetchArgument,
  fetchDebateById,
  fetchDebatesWithFilters,
  saveArgumentAsDraft,
  submitDraft,
  updateDraft,
} from "./debate";

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const decodeQ = (url: string) => {
  const encoded = url.split("?q=")[1];
  return JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.get.mockResolvedValue({ data: { data: [] } });
  mocked.post.mockResolvedValue({ data: { message: "ok" } });
  mocked.patch.mockResolvedValue({ data: { message: "ok" } });
});

describe("fetchDebatesWithFilters", () => {
  it("omits keys when filters are empty", async () => {
    await fetchDebatesWithFilters({});
    expect(decodeQ(mocked.get.mock.calls[0][0])).toEqual({});
  });

  it("maps query → queryStr", async () => {
    await fetchDebatesWithFilters({ query: "climate" });
    expect(decodeQ(mocked.get.mock.calls[0][0])).toEqual({
      queryStr: "climate",
    });
  });

  it("joins tags with comma and includes tags_match", async () => {
    await fetchDebatesWithFilters({ tags: ["1", "2", "3"], tags_match: "all" });
    expect(decodeQ(mocked.get.mock.calls[0][0])).toEqual({
      tags: "1,2,3",
      tags_match: "all",
    });
  });

  it("combines all filters", async () => {
    await fetchDebatesWithFilters({
      query: "health",
      tags: ["7"],
      tags_match: "any",
    });
    expect(decodeQ(mocked.get.mock.calls[0][0])).toEqual({
      queryStr: "health",
      tags: "7",
      tags_match: "any",
    });
  });

  it("unwraps the response envelope", async () => {
    mocked.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
    await expect(fetchDebatesWithFilters({})).resolves.toEqual([{ id: 1 }]);
  });
});

describe("createDebate", () => {
  it("POSTs to /debates with the payload", async () => {
    await createDebate({ title: "t", tagsIds: [1], createdTags: ["new"] });
    expect(mocked.post).toHaveBeenCalledWith("/debates", {
      title: "t",
      tagsIds: [1],
      createdTags: ["new"],
    });
  });
});

describe("createArgument", () => {
  it("POSTs to /debates/:id/argument", async () => {
    await createArgument(42, {
      title: "Pro",
      content: "...",
      argumentType: "PRO" as unknown as never,
    });
    expect(mocked.post.mock.calls[0][0]).toBe("/debates/42/argument");
  });
});

describe("fetchDebateById", () => {
  it("GETs /debates/:id and unwraps data.data", async () => {
    mocked.get.mockResolvedValueOnce({ data: { data: { id: 9 } } });
    await expect(fetchDebateById(9)).resolves.toEqual({ id: 9 });
    expect(mocked.get).toHaveBeenCalledWith("/debates/9");
  });
});

describe("fetchArgument", () => {
  it("GETs debates/:did/argument/:aid", async () => {
    await fetchArgument(1, 2);
    expect(mocked.get).toHaveBeenCalledWith("debates/1/argument/2");
  });
});

describe("drafts", () => {
  it("saveArgumentAsDraft POSTs to /debates/:id/draft", async () => {
    await saveArgumentAsDraft(5, {
      title: "t",
      content: "c",
      argumentType: "CON" as unknown as never,
    });
    expect(mocked.post.mock.calls[0][0]).toBe("/debates/5/draft");
  });

  it("updateDraft PATCHes /debates/:id/draft/:did", async () => {
    await updateDraft({
      debateId: 5,
      draftId: 11,
      draftData: {
        title: "t",
        content: "c",
        argumentType: "PRO" as unknown as never,
      },
    });
    expect(mocked.patch.mock.calls[0][0]).toBe("/debates/5/draft/11");
  });

  it("submitDraft POSTs /debates/:id/draft/:did/save", async () => {
    await submitDraft({
      debateId: 5,
      draftId: 11,
      draftData: {
        title: "t",
        content: "c",
        argumentType: "PRO" as unknown as never,
      },
    });
    expect(mocked.post.mock.calls[0][0]).toBe("/debates/5/draft/11/save");
  });
});
