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
    '@arcanewizards/talisman-arcade/assets/logo-animated.svg',
    '@arcanewizards/talisman-arcade/assets/logo-static.svg',
  ],
  sourcemap: false,
});
