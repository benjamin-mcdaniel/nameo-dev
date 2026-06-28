// Stub — returns zero conflict score until web search + brand list is implemented.
export async function scoreConflict(_word) {
  return { score: 0, links: [], checked_at: Date.now() };
}
