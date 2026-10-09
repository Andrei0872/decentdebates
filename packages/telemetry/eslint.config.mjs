import baseConfig from '@decentdebates/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**', 'eslint.config.mjs'],
  },
];
