import nextConfig from '@decentdebates/eslint-config/next';

export default [
  ...nextConfig,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.turbo/**',
      '.next/**',
      'out/**',
      'build/**',
      'test-results/**',
      'playwright-report/**',
      'next-env.d.ts',
      'eslint.config.mjs',
    ],
  },
];
