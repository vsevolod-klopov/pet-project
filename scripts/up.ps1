$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

$Mode = if ($args.Count -gt 0) { $args[0] } else { "prod" }

if ($Mode -eq "dev") {
  docker compose -f docker-compose.dev.yml up --build
} else {
  docker compose up --build
}
