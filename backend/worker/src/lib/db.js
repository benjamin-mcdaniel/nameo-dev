// ── DB helpers shared across runners ─────────────────────────────────────────
//
// updateReportStatus       — write status + result back to D1 (re-exported from report-status.js)
// executeAllPendingReports — fan out all pending reports for a session
// runSessionReport         — dispatch to the correct runner by report type

import { updateReportStatus }          from './report-status.js'
import { sendNtfyAlert }               from './notify.js'
import { runDomainAvailabilityReport } from '../runners/domains.js'
import { runSocialHandlesReport }      from '../runners/social.js'
import { runAppStoreReport }           from '../runners/app-store.js'
import { runProductsForSaleReport }    from '../runners/products.js'
import { runTrademarkReport }          from '../runners/trademark.js'
import { runNameGeneratorReport }      from '../runners/name-generator.js'

export { updateReportStatus }

// Each report fires as its own independent ctx.waitUntil() so domain (fast)
// and trademark (slow) run in parallel — neither can time out the other.
export async function executeAllPendingReports(env, ctx, sessionId) {
  const db = env.NAMEO_DB
  if (!db) return
  try {
    const reports = await db
      .prepare('SELECT id, report_type, input_json FROM session_reports WHERE session_id = ? AND status = ?')
      .bind(sessionId, 'pending')
      .all()
    for (const report of (reports.results || [])) {
      let input = null
      try { input = JSON.parse(report.input_json || 'null') } catch { input = null }
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(runSessionReport(env, report.id, report.report_type, input))
      } else {
        // Fallback: sequential (unit tests / no ctx)
        await runSessionReport(env, report.id, report.report_type, input)
      }
    }
  } catch { /* non-fatal — session still created successfully */ }
}

export async function runSessionReport(env, reportId, reportType, input) {
  try {
    await updateReportStatus(env, reportId, 'running', null)
    if (reportType === 'domain_availability') {
      await runDomainAvailabilityReport(env, reportId, input)
    } else if (reportType === 'social_handles') {
      await runSocialHandlesReport(env, reportId, input)
    } else if (reportType === 'app_store') {
      await runAppStoreReport(env, reportId, input)
    } else if (reportType === 'products_for_sale') {
      await runProductsForSaleReport(env, reportId, input)
    } else if (reportType === 'trademark') {
      await runTrademarkReport(env, reportId, input)
    } else if (reportType === 'questionnaire' || reportType === 'name_candidates') {
      await runNameGeneratorReport(env, reportId, reportType, input)
    } else {
      await updateReportStatus(env, reportId, 'error', { error: 'unknown_report_type' })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateReportStatus(env, reportId, 'error', { error: msg })
    await sendNtfyAlert(
      env,
      `Runner error: ${reportType}`,
      `Report ${reportId} failed\n${msg}`,
      'high',
    )
  }
}
