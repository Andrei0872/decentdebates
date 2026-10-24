import * as fs from "fs";
import * as path from "path";
import * as dotenvFlow from "dotenv-flow";

const DEFAULT_NODE_ENV = "development";

// `src/` and `dist/src/` sit at different depths, so callers pass `__dirname`
// and the package root is found by walking up to its `package.json`.
function findPackageRoot(fromDir: string): string {
  let dir = fromDir;

  while (!fs.existsSync(path.join(dir, "package.json"))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`No package.json found above ${fromDir}`);
    }
    dir = parent;
  }

  return dir;
}

export function loadEnv(fromDir: string): void {
  const files = dotenvFlow.listFiles({
    path: findPackageRoot(fromDir),
    node_env: process.env.NODE_ENV ?? DEFAULT_NODE_ENV,
  });

  // Container images ship without env files; config arrives as real env vars.
  if (files.length === 0) {
    return;
  }

  const { error } = dotenvFlow.load(files, { silent: true });
  if (error) {
    throw error;
  }
}

export function readEnvFile(file: string): Record<string, string> {
  return dotenvFlow.parse(file);
}
