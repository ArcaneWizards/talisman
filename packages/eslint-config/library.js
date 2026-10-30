const { resolve } = require('node:path');
const js = require('@eslint/js');
const globals = require('globals');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-config-prettier');
const turbo = require('eslint-config-turbo/flat').default;
const reactHooks = require('eslint-plugin-react-hooks');
const jsdoc = require('eslint-plugin-jsdoc');
const jest = require('eslint-plugin-jest');
const unusedImports = require('eslint-plugin-unused-imports');
const { REACT_CLASS_NAME_RESTRICTED_SYNTAX } = require('./react-tailwind.js');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [
      // Ignore dotfiles
      '**/.*.js',
      '**/dist/',
      '**/coverage/',
    ],
  },
  // Force ESLint to lint .jsx / .ts / .tsx files
  { files: ['**/*.js?(x)', '**/*.ts?(x)'] },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  prettier,
  ...turbo,
  reactHooks.configs['recommended-latest'],
  jsdoc.configs['flat/recommended-typescript'],
  {
    plugins: {
      jest,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...jest.environments.globals.globals,
        React: true,
        JSX: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project,
        },
      },
      'react-hooks': {
        additionalEffectHooks: '(useNotificationHandler)',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
      'no-console': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'error',
        {
          // TODO: remove once we have updated eslint-plugin-react-hooks to v6.1.1 or later
          additionalHooks: '(useNotificationHandler)',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/tag-lines': [
        'warn',
        'any',
        {
          startLines: 1,
        },
      ],
    },
  },
  {
    files: ['**/*.jsx', '**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...REACT_CLASS_NAME_RESTRICTED_SYNTAX],
    },
  },
  {
    files: ['**/*.test.js?(x)', '**/*.test.ts?(x)'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
