// name-generator.js
//
// Algorithmic factory that produces domain name candidates from seed words
// and a directions object produced by the LLM director.
//
// The factory's job: enumerate all reasonable permutations fast and cheaply.
// The LLM's job: give the factory a head-start by suggesting relevant
// concepts, syllables, and style cues — not to name-generate itself.

import leoProfanity from 'leo-profanity'

// TLDs to check against every candidate name
export const DEFAULT_TLDS = ['.com', '.io', '.ai', '.co', '.app', '.dev']

// Common startup prefixes/suffixes always included regardless of directions
const BASE_PREFIXES = ['get', 'try', 'use', 'go', 'hey', 'meet', 'my', 'the']
const BASE_SUFFIXES = ['hq', 'app', 'ai', 'co', 'hub', 'lab', 'pro', 'now', 'ly', 'io', 'plus', 'api']

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(word) {
  return String(word || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function unique(arr) {
  return [...new Set(arr)]
}

let profanityReady = false
function isSafe(name) {
  if (name.length < 2 || name.length > 24) return false
  // Skip purely numeric
  if (/^\d+$/.test(name)) return false
  try {
    if (!profanityReady) { leoProfanity.loadDictionary(); profanityReady = true }
    if (leoProfanity.check(name)) return false
  } catch { /* allow through */ }
  return true
}

// ── Candidate generation strategies ──────────────────────────────────────────

function makeVariants(words) {
  const variants = []
  for (const w of words) {
    if (!w || w.length < 2) continue
    variants.push(w)
    // Truncations (for longer words)
    if (w.length >= 6) {
      variants.push(w.slice(0, Math.ceil(w.length * 0.6)))
      variants.push(w.slice(0, 4))
    }
    if (w.length >= 4) {
      variants.push(w.slice(0, 3))
    }
  }
  return unique(variants.filter(Boolean))
}

function blends(a, b) {
  if (!a || !b) return []
  const mid = Math.ceil(a.length / 2)
  return unique([
    a + b,
    b + a,
    a.slice(0, mid) + b,
    a + b.slice(0, Math.ceil(b.length / 2)),
    a.slice(0, 3) + b,
    a + b.slice(0, 3),
  ])
}

function withPrefixes(name, prefixes) {
  return prefixes.map(p => p + name)
}

function withSuffixes(name, suffixes) {
  return suffixes.map(s => name + s)
}

function alternateTldNames(name) {
  // Names that "embed" a TLD for the .io / .ai / .co extension trick
  // e.g. seed=flow → flowai, flowy, flowio
  return unique([
    name + 'ai',
    name + 'io',
    name + 'co',
    name + 'ly',
    name + 'ify',
    name + 'er',
    name + 'ful',
  ])
}

function acronyms(words) {
  if (words.length < 2) return []
  const acr = words.map(w => w[0]).join('')
  return acr.length >= 2 ? [acr] : []
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a de-duped list of safe candidate names from the seed and LLM directions.
 *
 * @param {string[]} seedWords   Normalized seed words from user input
 * @param {object}   directions  Output of llm-director.js
 * @param {number}   [limit=1200]
 * @returns {string[]}
 */
export function generateCandidates(seedWords, directions = {}, limit = 1200) {
  const {
    concepts   = [],   // e.g. ['swift', 'clear', 'bright']
    syllables  = [],   // e.g. ['ver', 'sol', 'zen']
    prefixes   = [],   // LLM-suggested prefixes
    suffixes   = [],   // LLM-suggested suffixes
  } = directions

  // Normalize all inputs
  const seeds    = unique(seedWords.map(normalize).filter(Boolean))
  const concepts_ = unique(concepts.map(normalize).filter(Boolean).slice(0, 15))
  const syllables_ = unique(syllables.map(normalize).filter(Boolean).slice(0, 10))
  const extraPre = unique(prefixes.map(normalize).filter(Boolean).slice(0, 8))
  const extraSuf = unique(suffixes.map(normalize).filter(Boolean).slice(0, 8))

  const allPrefixes = unique([...BASE_PREFIXES, ...extraPre])
  const allSuffixes = unique([...BASE_SUFFIXES, ...extraSuf])

  // Concept pool = seeds + concepts + syllables
  const pool = unique([...seeds, ...concepts_, ...syllables_])
  const poolVariants = makeVariants(pool)

  const names = new Set()

  const add = (name) => {
    const n = normalize(name)
    if (n && isSafe(n)) names.add(n)
  }

  // 1. Seeds + their variants directly
  for (const w of [...seeds, ...poolVariants]) {
    add(w)
  }

  // 2. Prefixed/suffixed seeds
  for (const seed of seeds) {
    for (const c of withPrefixes(seed, allPrefixes)) add(c)
    for (const c of withSuffixes(seed, allSuffixes)) add(c)
    for (const c of alternateTldNames(seed)) add(c)
  }

  // 3. Concept variations (prefix/suffix with each concept)
  for (const concept of concepts_) {
    add(concept)
    for (const c of withPrefixes(concept, allPrefixes)) add(c)
    for (const c of withSuffixes(concept, allSuffixes)) add(c)
  }

  // 4. Blends: seed × concept, seed × syllable, concept pairs
  for (const seed of seeds) {
    for (const concept of concepts_) {
      for (const b of blends(seed, concept)) add(b)
    }
    for (const syl of syllables_) {
      for (const b of blends(seed, syl)) add(b)
    }
  }

  // 5. Concept × concept blends (limited)
  const conceptPairs = concepts_.slice(0, 5)
  for (let i = 0; i < conceptPairs.length; i++) {
    for (let j = i + 1; j < conceptPairs.length; j++) {
      for (const b of blends(conceptPairs[i], conceptPairs[j])) add(b)
    }
  }

  // 6. Syllable combinations (short 2-syllable combos)
  for (let i = 0; i < syllables_.length; i++) {
    for (let j = 0; j < syllables_.length; j++) {
      if (i !== j) add(syllables_[i] + syllables_[j])
    }
  }

  // 7. Acronyms of multi-word seeds
  for (const a of acronyms(seeds)) {
    add(a)
    for (const c of withPrefixes(a, allPrefixes)) add(c)
    for (const c of withSuffixes(a, allSuffixes)) add(c)
  }

  // 8. Seed + seed combinations (multi-word seeds)
  if (seeds.length > 1) {
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        for (const b of blends(seeds[i], seeds[j])) add(b)
      }
    }
  }

  return [...names].slice(0, limit)
}

/**
 * Expand candidate names into (name, tld) pairs for domain checking.
 */
export function expandToDomainPairs(names, tlds = DEFAULT_TLDS) {
  const pairs = []
  for (const name of names) {
    for (const tld of tlds) {
      pairs.push({ name, tld })
    }
  }
  return pairs
}
