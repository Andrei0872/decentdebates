import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { loadEnv } from "./load-env";

const KEY = "DECENTDEBATES_LOAD_ENV_SPEC";

function createPackage(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "load-env-"));
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  fs.mkdirSync(path.join(root, "dist", "src"), { recursive: true });

  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), `${KEY}=${value}\n`);
  }

  return root;
}

describe("loadEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[KEY];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("finds the package root from a nested directory", () => {
    const root = createPackage({ ".env": "base" });

    loadEnv(path.join(root, "dist", "src"));

    expect(process.env[KEY]).toBe("base");
  });

  it("lets a real env var win over every file", () => {
    const root = createPackage({ ".env": "base", ".env.test": "mode" });
    process.env[KEY] = "real";

    loadEnv(root);

    expect(process.env[KEY]).toBe("real");
  });

  it("orders .env.{mode}.local > .env.{mode} > .env.local > .env", () => {
    process.env.NODE_ENV = "development";
    const files = {
      ".env": "base",
      ".env.local": "local",
      ".env.development": "mode",
      ".env.development.local": "mode-local",
    };

    const winners = Object.keys(files).map((_, i) => {
      const subset = Object.fromEntries(Object.entries(files).slice(0, i + 1));
      delete process.env[KEY];
      loadEnv(createPackage(subset));
      return process.env[KEY];
    });

    expect(winners).toEqual(["base", "local", "mode", "mode-local"]);
  });

  it("skips .env.local in the test mode", () => {
    process.env.NODE_ENV = "test";
    const root = createPackage({ ".env": "base", ".env.local": "local" });

    loadEnv(root);

    expect(process.env[KEY]).toBe("base");
  });

  it("defaults to the development mode", () => {
    delete process.env.NODE_ENV;
    const root = createPackage({ ".env": "base", ".env.development": "mode" });

    loadEnv(root);

    expect(process.env[KEY]).toBe("mode");
  });

  it("does nothing without env files", () => {
    const root = createPackage({});

    expect(() => loadEnv(root)).not.toThrow();
    expect(process.env[KEY]).toBeUndefined();
  });
});
