import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    isolate: true,
    reporter: ['verbose'],
    include: ['tests/qa/**/*.test.js'],
    // QA tests hit a live network — give them breathing room
    testTimeout: 30000,
    hookTimeout: 10000,
    // Run serially so we don't hammer the API with parallel session creates
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
