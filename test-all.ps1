# HSC Power - Run All Tests Script (PowerShell)
# This script runs both backend and frontend tests

Write-Host "HSC Power - Running All Tests" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$failures = 0

# Backend Tests
Write-Host ""
Write-Host "Running Backend Tests..." -ForegroundColor Yellow
Set-Location backend
try {
    npm test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend tests passed" -ForegroundColor Green
    } else {
        Write-Host "Backend tests failed" -ForegroundColor Red
        $failures++
    }
} catch {
    Write-Host "Backend tests error: $_" -ForegroundColor Red
    $failures++
}
Set-Location ..

# Frontend Tests
Write-Host ""
Write-Host "Running Frontend Tests..." -ForegroundColor Yellow
Set-Location frontend
try {
    npm run test:ci
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend tests passed" -ForegroundColor Green
    } else {
        Write-Host "Frontend tests failed" -ForegroundColor Red
        $failures++
    }
} catch {
    Write-Host "Frontend tests error: $_" -ForegroundColor Red
    $failures++
}
Set-Location ..

# Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
if ($failures -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$failures test suite(s) failed" -ForegroundColor Red
    exit 1
}

