module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', 'target/', 'd.ts/', '*.d.ts'],
  extends: [
    '@proc7ts',
  ],
  overrides: [
    {
      files: ['*.js'],
      env: {
        node: true,
      },
    },
    {
      files: ['*.ts'],
      extends: [
        '@proc7ts/eslint-config/typescript',
      ],
      parserOptions: {
        project: './tsconfig.json',
      },
      env: {
        browser: true,
      },
    },
    {
      files: ['*.spec.ts'],
      plugins: [
        'jest',
      ],
      extends: [
        'plugin:jest/recommended',
        'plugin:jest/style',
      ],
      env: {
        'jest/globals': true,
      },
    },
  ],
};
