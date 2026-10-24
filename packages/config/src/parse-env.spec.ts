import { z } from "zod";
import { parseEnv } from "./parse-env";
import { port } from "./schemas";

const schema = z.object({ PORT: port, NAME: z.string().default("api") });

describe("parseEnv", () => {
  it("returns the coerced values with defaults applied", () => {
    expect(parseEnv(schema, { PORT: "5432" })).toEqual({
      PORT: 5432,
      NAME: "api",
    });
  });

  it("names every invalid variable in the error", () => {
    expect(() => parseEnv(schema, { PORT: "nope", NAME: "" })).toThrow(
      /Invalid environment variables:[\s\S]*PORT/,
    );
  });
});
