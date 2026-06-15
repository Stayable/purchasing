# get-write-refresh-token.ps1 — one-time WRITE-scoped Zoho refresh-token generation.
# Twin of get-refresh-token.ps1, but for the portal award/approve write path (api/award.js).
# Prompts for the 3 values so NOTHING secret is stored in this file or in the repo.
# It only prints the refresh token to the screen; copy it straight into Vercel.
#
# RUN (paste this one line into PowerShell, in the repo folder):
#   powershell -ExecutionPolicy Bypass -File .\get-write-refresh-token.ps1
#
# Datacenter = US (accounts.zoho.com). In the Zoho Self Client, generate the grant code with
# SCOPE: ZohoCRM.modules.ALL   (read+write on records — required for the award PUT).
# Generate a FRESH grant code right before running (it expires in ~3 min and is single-use).
#
# IMPORTANT: this token is the WRITE token. Paste it into Vercel as  ZOHO_WRITE_REFRESH_TOKEN
# (a DISTINCT env var from the read-only ZOHO_REFRESH_TOKEN — do NOT overwrite that one).

$clientId     = (Read-Host 'Client ID').Trim()
$clientSecret = (Read-Host 'Client Secret').Trim()
$code         = (Read-Host 'Grant code (scope ZohoCRM.modules.ALL; use within 3 min)').Trim()

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
  exit 1
}

Write-Host ''
if ($resp.refresh_token) {
  Write-Host '=== WRITE REFRESH TOKEN — paste into Vercel  ZOHO_WRITE_REFRESH_TOKEN ===' -ForegroundColor Green
  Write-Host $resp.refresh_token
  Write-Host '======================================================================='
  Write-Host '(Then: Vercel -> Settings -> Environment Variables -> add ZOHO_WRITE_REFRESH_TOKEN -> Redeploy)'
  Write-Host 'Do NOT reuse the read-only ZOHO_REFRESH_TOKEN slot.' -ForegroundColor Yellow
} else {
  Write-Host 'No refresh_token in the response. Full response below:' -ForegroundColor Yellow
  $resp | ConvertTo-Json
  Write-Host ''
  Write-Host 'Common causes: "invalid_code" = grant code expired/used (regenerate); scope missing modules.ALL = regenerate the code with the write scope.' -ForegroundColor Yellow
}
