import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    hookTimeout: 60_000,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/{unit,int}/**/*.spec.ts'],
    testTimeout: 30_000,
  },
})
