// ── Name Generator runner ─────────────────────────────────────────────────────
//
// Handles two sequential report types for the name_generator session flow:
//
//   questionnaire  — submitted by the wizard; marks itself complete immediately
//                    so the frontend stops polling, then triggers name_candidates
//
//   name_candidates — calls the AI (Claude via env.AI_API_KEY) with the
//                     questionnaire fields and returns 10-20 candidate names
//
// The AI prompt and result shape are defined here. Keep them in this file so
// prompt iteration doesn't require touching the main router.
//
// Result shape (name_candidates):
//   { names: [{ name, rationale, score }], generated_at }
//   score: 0-100 integer (higher = better fit based on questionnaire)

import { updateReportStatus } from '../lib/report-status.js'

// ── Questionnaire ─────────────────────────────────────────────────────────────

export async function runNameGeneratorReport(env, reportId, reportType, input) {
  if (reportType === 'questionnaire') {
    await runQuestionnaireReport(env, reportId, input)
  } else if (reportType === 'name_candidates') {
    await runNameCandidatesReport(env, reportId, input)
  } else {
    await updateReportStatus(env, reportId, 'error', { error: 'unknown_report_type' })
  }
}

async function runQuestionnaireReport(env, reportId, input) {
  // The questionnaire data is already stored in input_json when the session is created.
  // Mark it complete so the frontend advances; the candidate generation is a separate report.
  await updateReportStatus(env, reportId, 'complete', {
    summary: input ?? {},
    completed_at: Math.floor(Date.now() / 1000),
  })

  // TODO: Auto-trigger name_candidates report here once AI is wired.
  // 1. Look up session_id for this reportId
  // 2. INSERT a name_candidates report with the questionnaire data as input
  // 3. Call runNameCandidatesReport for that new report ID
}

// ── Name Candidates ───────────────────────────────────────────────────────────

async function runNameCandidatesReport(env, reportId, input) {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    await updateReportStatus(env, reportId, 'error', {
      error: 'ai_not_configured',
      message: 'ANTHROPIC_API_KEY is not set. Add it to wrangler.toml secrets.',
    })
    return
  }

  const prompt = buildNameGenPrompt(input ?? {})

  let candidates = []
  try {
    candidates = await callClaude(apiKey, prompt)
  } catch (err) {
    await updateReportStatus(env, reportId, 'error', {
      error: 'ai_call_failed',
      message: err?.message ?? String(err),
    })
    return
  }

  await updateReportStatus(env, reportId, 'complete', {
    names: candidates,
    generated_at: Math.floor(Date.now() / 1000),
  })
}

function buildNameGenPrompt(input) {
  const {
    product_description = '',
    industry = '',
    vibes = [],
    name_length = 'any',
    start_letters = '',
    avoid_words = '',
  } = input

  const vibeStr   = Array.isArray(vibes) && vibes.length ? vibes.join(', ') : 'none specified'
  const startStr  = start_letters ? `Should start with: ${start_letters}.` : ''
  const avoidStr  = avoid_words  ? `Avoid these words or roots: ${avoid_words}.` : ''
  const lengthStr = name_length !== 'any' ? `Preferred length: ${name_length} syllables.` : ''

  return `You are a brand naming expert. Generate 15 original, creative product/brand names for a startup based on the following brief.

Product description: ${product_description || 'Not specified'}
Industry: ${industry || 'Not specified'}
Desired vibes / tone: ${vibeStr}
${lengthStr}
${startStr}
${avoidStr}

Requirements for each name:
- Original and memorable
- Easy to spell and pronounce
- No existing well-known brands with that exact name
- Suitable as a product name (not generic or descriptive)

Return a JSON array (and nothing else) with this exact shape:
[
  { "name": "Lumio", "rationale": "One sentence why this fits the brief.", "score": 87 },
  ...
]

score is an integer 0-100 representing how well the name fits the brief. Return exactly 15 names, sorted by score descending.`
}

async function callClaude(apiKey, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',  // fast + cheap for structured generation
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data?.content?.[0]?.text ?? ''

  // Parse the JSON array out of the response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Claude response did not contain a JSON array')

  const parsed = JSON.parse(match[0])
  if (!Array.isArray(parsed)) throw new Error('Claude response is not an array')

  // Validate and normalise each entry
  return parsed.map((item) => ({
    name:      String(item.name      ?? '').trim(),
    rationale: String(item.rationale ?? '').trim(),
    score:     Math.min(100, Math.max(0, Math.round(Number(item.score ?? 50)))),
  })).filter((item) => item.name)
}
