// ── updateReportStatus ────────────────────────────────────────────────────────
//
// Single function in its own file so runners can import it without creating
// a circular dependency with lib/db.js (which imports the runners).

export async function updateReportStatus(env, reportId, status, resultJson) {
  const db = env.NAMEO_DB
  if (!db) return
  const now = Math.floor(Date.now() / 1000)
  try {
    await db
      .prepare('UPDATE session_reports SET status = ?, result_json = ?, updated_at = ? WHERE id = ?')
      .bind(status, resultJson != null ? JSON.stringify(resultJson) : null, now, reportId)
      .run()
  } catch { /* non-fatal */ }
}
