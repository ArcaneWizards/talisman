const { resolve } = require("node:path");
const js = require("@eslint/js");
const globals = require("globals");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-config-prettier");
const turbo = require("eslint-config-turbo/flat").default;
const jest = require("eslint-plugin-jest");
const {
  REACT_CLASS_NAME_RESTRICTED_SYNTAX,
} = require("./react-tailwind.js");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * This is a custom ESLint configuration for use with
 * internal (bundled by their consumer) libraries
 * that utilize React.
 */

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: [
      // Ignore dotfiles
      "**/.*.js",
      "**/dist/",
      "**/coverage/",
    ],
  },
  // Force ESLint to detect .tsx files
  { files: ["**/*.js?(x)", "**/*.ts?(x)"] },
  js.configs.recommended,
  ...tsPlugin.configs["flat/recommended"],
  prettier,
  ...turbo,
  {
    plugins: { jest },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...jest.environments.globals.globals,
        React: true,
        JSX: true,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project,
        },
      },
    },
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    rules: {
      "no-restricted-syntax": ["error", ...REACT_CLASS_NAME_RESTRICTED_SYNTAX],
    },
  },
];
