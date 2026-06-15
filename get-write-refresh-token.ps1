# get-write-refresh-token.ps1 — one-time WRITE-scoped Zoho refresh-token generation.
# For the portal award/approve write path (api/award.js). Prompts for the 3 values so
# NOTHING secret is stored in this file or the repo; it only prints the refresh token.
#
# RUN THIS IN A REAL POWERSHELL WINDOW (not the Claude `!` prefix — Read-Host needs a
# keyboard). Right-click the file -> Run with PowerShell, or in a PowerShell window:
#   powershell -ExecutionPolicy Bypass -File .\get-write-refresh-token.ps1
#
# GET A GRANT CODE FIRST (Zoho Self Client, US datacenter):
#   1. https://api-console.zoho.com  ->  your Self Client  ->  "Generate Code"
#   2. Scope:  ZohoCRM.modules.ALL     (read+write — required for the award PUT;
#              the read token's modules.READ is NOT enough)
#   3. Pick any duration; copy the code. It expires in ~3 min and is single-use,
#      so generate it right before running this.
#
# RESULT: paste the printed token into Vercel as  ZOHO_WRITE_REFRESH_TOKEN  (Production
# scope) — a DISTINCT env var from the read-only ZOHO_REFRESH_TOKEN. Do NOT overwrite that.

$clientId     = (Read-Host 'Client ID').Trim()
$clientSecret = (Read-Host 'Client Secret').Trim()
$code         = (Read-Host 'Grant code (scope ZohoCRM.modules.ALL; use within 3 min)').Trim()

if (-not $clientId -or -not $clientSecret -or -not $code) {
  Write-Host ''
  Write-Host 'All three values are required. Nothing was entered — aborting.' -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

$body = @{
  grant_type    = 'authorization_code'
  client_id     = $clientId
  client_secret = $clientSecret
  code          = $code
}

try {
  $resp = Invoke-RestMethod -Method Post -Uri 'https://accounts.zoho.com/oauth/v2/token' -Body $body
} catch {
  Write-Host ''
  Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
  Read-Host 'Press Enter to close'
  exit 1
}

Write-Host ''
if ($resp.refresh_token) {
  Write-Host '=== WRITE REFRESH TOKEN — paste into Vercel  ZOHO_WRITE_REFRESH_TOKEN (Production) ===' -ForegroundColor Green
  Write-Host $resp.refresh_token
  Write-Host '====================================================================================='
  Write-Host 'Next: Vercel -> purchasing -> Settings -> Environment Variables -> add'
  Write-Host '      ZOHO_WRITE_REFRESH_TOKEN (Production) -> Redeploy.'
  Write-Host 'Do NOT reuse the read-only ZOHO_REFRESH_TOKEN slot.' -ForegroundColor Yellow
} else {
  Write-Host 'No refresh_token in the response. Full response below:' -ForegroundColor Yellow
  $resp | ConvertTo-Json
  Write-Host ''
  Write-Host 'Common causes:' -ForegroundColor Yellow
  Write-Host '  invalid_code   -> grant code expired/used; generate a fresh one and retry.'
  Write-Host '  invalid_client -> Client ID/Secret wrong, or code is from a different self-client.'
  Write-Host '  scope error    -> regenerate the code with scope ZohoCRM.modules.ALL.'
}

Write-Host ''
Read-Host 'Press Enter to close'
