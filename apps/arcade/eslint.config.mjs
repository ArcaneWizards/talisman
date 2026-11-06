import { defineConfig } from 'eslint/config';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import library from '@talisman-midi/eslint-config/library.js';
import reactTailwindConfig from '@talisman-midi/eslint-config/react-tailwind.js';

const { REACT_TAILWIND_CALLEES } = reactTailwindConfig;

export default defineConfig([
  library,
  {
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/components/frontend/frontend.css',
        tsconfig: './tsconfig.json',
        callees: REACT_TAILWIND_CALLEES,
      },
    },
    rules: {
      // Prettier may wrap the prop onto a new line, making the class list fit again.
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'warn',
        { strictness: 'loose' },
      ],
      'better-tailwindcss/no-unknown-classes': 'error',
    },
  },
  {
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
    },
  },
]);
