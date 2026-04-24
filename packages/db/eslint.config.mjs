import nodeConfig from '@decentdebates/eslint-config/node';

export default [
  ...nodeConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**', 'eslint.config.mjs'],
  },
];
