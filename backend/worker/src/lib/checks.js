// DEPRECATED — checks.js (URL-scraping availability checks)
//
// This file is no longer used. All availability checking is handled by
// individual runners in src/runners/ which use platform-specific APIs.
//
// Kept as a stub so imports in src/index.js don't break the build until
// those call sites are removed.

export async function runChecksForName() {
  return {}
}
