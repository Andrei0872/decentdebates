import globals from 'globals';
import base from './base.js';

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
    files: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.int-spec.ts',
      '**/*.e2e-spec.ts',
      '**/test/**/*.ts',
      '**/tests/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
