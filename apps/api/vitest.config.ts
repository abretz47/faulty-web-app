import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@team-tracker/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
