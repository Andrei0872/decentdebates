import globals from "globals";
import base from "./base.js";
import { restrictProcessEnv } from "./process-env.js";

const TEST_FILES = [
  "**/*.spec.ts",
  "**/*.test.ts",
  "**/*.int-spec.ts",
  "**/*.e2e-spec.ts",
  "**/test/**/*.ts",
  "**/tests/**/*.ts",
];

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: TEST_FILES,
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  ...restrictProcessEnv([
    "**/config.ts",
    "**/instrumentation.ts",
    ...TEST_FILES,
  ]),
];
