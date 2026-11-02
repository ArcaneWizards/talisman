import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/color.ts',
    'src/core.ts',
    'src/feedback.ts',
    'src/profile.ts',
    'src/util.ts',
  ],
  format: ['cjs', 'esm'],
  splitting: true,
  dts: true,
});
