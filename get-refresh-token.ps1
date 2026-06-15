# get-refresh-token.ps1 — one-time Zoho refresh-token generation (runbook step P1-B).
# Prompts for the 3 values so NOTHING secret is stored in this file or in the repo.
# It only prints the refresh token to the screen; copy it straight into Vercel.
#
# RUN (paste this one line into PowerShell, in the repo folder):
#   powershell -ExecutionPolicy Bypass -File .\get-refresh-token.ps1
#
# Datacenter = US (accounts.zoho.com). Generate a FRESH grant code right before running
# (it expires in ~3 min and is single-use).

$clientId     = (Read-Host 'Client ID').Trim()
$clientSecret = (Read-Host 'Client Secret').Trim()
$code         = (Read-Host 'Grant code (use within 3 min of generating)').Trim()

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
  Write-Host '=== REFRESH TOKEN — paste this into Vercel  ZOHO_REFRESH_TOKEN ===' -ForegroundColor Green
  Write-Host $resp.refresh_token
  Write-Host '================================================================='
  Write-Host '(Then: Vercel -> Settings -> Environment Variables -> update ZOHO_REFRESH_TOKEN -> Redeploy)'
} else {
  Write-Host 'No refresh_token in the response. Full response below:' -ForegroundColor Yellow
  $resp | ConvertTo-Json
  Write-Host ''
  Write-Host 'Common cause: "invalid_code" = the grant code expired or was already used. Generate a fresh one and rerun.' -ForegroundColor Yellow
}
