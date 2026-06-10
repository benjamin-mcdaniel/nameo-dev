// llm-director.js
//
// One focused call to Claude Haiku: given a seed + description, produce
// structured directions that tell the name-generator factory what to explore.
//
// The LLM reasons about the space; the factory does the enumeration.
// We call this ONCE per sweep, so cost is negligible (<$0.01).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL             = 'claude-haiku-4-5-20251001'
const MAX_TOKENS        = 512

const SYSTEM_PROMPT = `You are a brand naming strategist helping startups find available domain names.

Given a seed (words or short description), output a JSON object that guides an algorithmic name generator.
Be specific and creative — your job is to seed the factory with good raw material, not to write names yourself.

Output ONLY valid JSON with this exact shape (no markdown, no explanation):
{
  "concepts": ["word1", "word2", ...],   // 8–12 short evocative English words related to the product
  "syllables": ["syl1", "syl2", ...],    // 6–10 short phonetic syllables (2–4 chars) that sound good
  "prefixes": ["pre1", "pre2", ...],     // 4–6 action/modifier prefixes beyond the standard set
  "suffixes": ["suf1", "suf2", ...],     // 4–6 noun/modifier suffixes beyond the standard set
  "style": "techy|friendly|premium|playful"  // pick one that fits the brand
}

Rules:
- All values lowercase, letters only (a–z), no numbers, no hyphens
- concepts: real words or common startup portmanteaux that relate to the product's purpose
- syllables: pure phonetic building blocks, pronounceable, 2–4 chars (e.g. "vel", "zap", "nix", "lex")
- prefixes/suffixes: should feel natural as part of a brand name
- Keep it tight — quality over quantity`

/**
 * Call Claude Haiku to get name-generation directions for a seed.
 *
 * @param {string} seed   User-provided seed words / description
 * @param {string} apiKey ANTHROPIC_API_KEY
 * @returns {Promise<object>} Directions object (concepts, syllables, prefixes, suffixes, style)
 */
export async function getDirections(seed, apiKey) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system:     SYSTEM_PROMPT,
      messages: [{
        role:    'user',
        content: `Seed: "${seed}"`,
      }],
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const raw  = data?.content?.[0]?.text ?? ''

  // Parse the JSON — strip any accidental markdown fences
  const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()

  let directions
  try {
    directions = JSON.parse(cleaned)
  } catch {
    // LLM returned something unparseable — fall back to empty directions
    // so the generator still runs with base prefixes/suffixes
    console.error('llm-director: failed to parse response, using fallback', raw.slice(0, 200))
    directions = {}
  }

  return {
    concepts:  Array.isArray(directions.concepts)  ? directions.concepts.slice(0, 12)  : [],
    syllables: Array.isArray(directions.syllables) ? directions.syllables.slice(0, 10) : [],
    prefixes:  Array.isArray(directions.prefixes)  ? directions.prefixes.slice(0, 6)   : [],
    suffixes:  Array.isArray(directions.suffixes)  ? directions.suffixes.slice(0, 6)   : [],
    style:     ['techy', 'friendly', 'premium', 'playful'].includes(directions.style)
               ? directions.style : 'techy',
  }
}
