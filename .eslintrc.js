module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', 'target/', 'd.ts/', '*.d.ts'],
  extends: [
    '@surol',
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
        '@surol/eslint-config/typescript',
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
