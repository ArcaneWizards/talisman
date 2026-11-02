import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/start.ts',
    'src/components/frontend/index.tsx',
    'src/components/frontend/shared/index.tsx',
  ],
  format: ['cjs', 'esm'],
  splitting: false,
  dts: true,
  external: [
    '../LICENSE',
    '@arcanewizards/talisman-lab/assets/logo-animated.svg',
  ],
  sourcemap: false,
});
