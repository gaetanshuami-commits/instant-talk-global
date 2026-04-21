param(
    [string]$Action = "start"
)

if ($Action -eq "start") {
    python -m agents.orchestrator
}
elseif ($Action -eq "check-env") {
    python -m agents.check_env
}
else {
    Write-Output "Usage: .\agents\run.ps1 -Action start|check-env"
}
