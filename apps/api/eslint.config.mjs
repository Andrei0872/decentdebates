import nodeConfig from '@decentdebates/eslint-config/node';

export default [
  ...nodeConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
      },
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**', 'eslint.config.mjs'],
  },
];
