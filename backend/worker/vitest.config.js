import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Each test file gets a fresh module registry so vi.mock works cleanly
    isolate: true,
    // Print each test name (not just the summary)
    reporter: ['verbose'],
    // Unit tests only — QA tests use a separate config
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/index.js'],   // router is tested via QA, not unit tests
    },
  },
})
