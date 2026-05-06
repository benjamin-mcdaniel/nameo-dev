# DEPRECATED

This file documented the pre-session `#/advanced` and `#/search` workflow.
That approach has been replaced by the session-based model (v1.0).

**Current architecture:**
- Users create sessions at `#/sessions/new`
- Each session fans out report runners in parallel via `ctx.waitUntil()`
- Runner logic lives in `backend/worker/src/runners/`
- Session state is in D1 (`session_reports` table, polled by the frontend)

The old routes (`/search`, `/advanced`, `/advanced-report`, `/campaigns`) are
now archived in `frontend/src/router.js` and redirect to home.
