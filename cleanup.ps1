# Run once from the repo root to delete legacy files and directories.
# Open PowerShell in the repo root and run: .\cleanup.ps1
# After: git add -A && git commit -m "chore: remove legacy files"

Write-Host "Removing legacy root files..."
@(
  "LEARNINGS.md", "NAME_GENERATOR_GOALS.json", "NAMING_JOURNEY_SPEC.md",
  "UXREVIEW.md", "WORKFLOWS.md", "response.md", "goals",
  "deploy-main-worker.sh", "deploy-search-worker.sh",
  "package.json", "package-lock.json",
  "cleanup.sh"
) | ForEach-Object {
  if (Test-Path $_) { Remove-Item $_ -Force; Write-Host "  deleted $_" }
}

Write-Host "Removing legacy directories..."
@(
  "config", "portal",
  "backend\auth", "backend\orchestrator", "backend\tests", "backend\db"
) | ForEach-Object {
  if (Test-Path $_) { Remove-Item $_ -Recurse -Force; Write-Host "  deleted $_\" }
}

Write-Host "Removing stale vite timestamp files from git tracking..."
git rm --cached "frontend/vite.config.js.timestamp-*" 2>$null

Write-Host ""
Write-Host "Done. Now run:"
Write-Host "  git add -A"
Write-Host "  git commit -m 'chore: remove legacy files'"
Write-Host "  git push"
Write-Host ""
Write-Host "Then delete this script: Remove-Item cleanup.ps1"
