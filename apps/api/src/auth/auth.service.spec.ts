import { ConflictException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserService } from "src/entities/user/user.service";

// bcrypt's native loader emits a `url.parse()` deprecation warning on import.
jest.mock("bcrypt", () => ({ hash: async () => "hashed" }));

const NEW_USER = {
  username: "new-user",
  email: "new-user@example.com",
  password: "pas123",
};

function createService(insertOne: () => Promise<unknown>) {
  return new AuthService({} as never, { insertOne } as unknown as UserService);
}

describe("AuthService.register", () => {
  it("reports a taken username or email as a conflict", async () => {
    const service = createService(() =>
      Promise.reject(
        Object.assign(new Error("duplicate key"), { code: "23505" }),
      ),
    );

    await expect(service.register({ ...NEW_USER })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("does not expose other database errors as client errors", async () => {
    const service = createService(() =>
      Promise.reject(new Error("connect ECONNREFUSED")),
    );

    const error = await service.register({ ...NEW_USER }).catch((e) => e);

    expect(error).not.toBeInstanceOf(ConflictException);
    expect(error.message).not.toContain("ECONNREFUSED");
  });
});
