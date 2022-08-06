const typescriptEslintRecommended = require('@typescript-eslint/eslint-plugin').configs.recommended;

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      experimentalObjectRestSpread: true,
    },
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    // Enables eslint-plugin-prettier and eslint-config-prettier.
    // This will display prettier errors as ESLint errors.
    // Make sure this is always the last configuration in the extends array.
    'plugin:prettier/recommended',
  ],
  plugins: ['import', 'babel', 'prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'no-console': 'warn',
    'no-eval': 'error',
    'import/first': 'error',
    'no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint'],
      rules: Object.assign(typescriptEslintRecommended.rules, {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        'no-console': 'off',
        'import/order': [
          'error',
          {
            groups: ['type', 'object', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'always',
            pathGroups: [
              {
                pattern: '~',
                group: 'unknown',
                position: 'before',
              },
              {
                pattern: '@mysql/xdevapi',
                group: 'external',
                position: 'before',
              },
              {
                pattern: 'knex',
                group: 'external',
                position: 'before',
              },
              {
                pattern: 'pg',
                group: 'external',
                position: 'before',
              },
              {
                pattern: 'oracledb',
                group: 'external',
                position: 'before',
              },
              {
                pattern: 'lib/client/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: 'lib/controllers/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: 'lib/errors/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: 'lib/middleware/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: 'lib/types/**',
                group: 'internal',
                position: 'before',
              },
              {
                pattern: 'lib/utils/**',
                group: 'internal',
                position: 'before',
              },
            ],
            pathGroupsExcludedImportTypes: ['mysql', '@mysql/xdevapi', 'knex', 'pg', 'oracledb', 'unknown'],
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
            warnOnUnassignedImports: true,
          },
        ],
      }),
    },
  ],
  settings: {
    node: {
      version: 'detect',
    },
  },
};
