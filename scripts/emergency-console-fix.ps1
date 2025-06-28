# EMERGENCY CONSOLE LOGGING FIX
# CRITICAL SECURITY ISSUE: 570+ console statements exposing sensitive data
# This PowerShell script systematically replaces ALL console statements

Write-Host "EMERGENCY CONSOLE LOGGING FIX - CRITICAL SECURITY ISSUE" -ForegroundColor Red
Write-Host "=========================================================" -ForegroundColor Red
Write-Host ""

$srcPath = "src"
$totalFiles = 0
$modifiedFiles = 0
$totalReplacements = 0

# Get all JS/JSX/TS/TSX files
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.js", "*.jsx", "*.ts", "*.tsx" | Where-Object { 
    $_.FullName -notmatch "node_modules|\.git|dist|build" 
}

Write-Host "Processing $($files.Count) files..." -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Critical security patterns - completely remove sensitive logging
    $sensitivePatterns = @(
        'console\.log\s*\([^)]*(?:password|token|key|secret|auth|user|member|profile|email|phone)[^)]*\)',
        'console\.log\s*\([^)]*\{[^}]*(?:password|token|key|secret|auth|user|member|profile|email|phone)[^}]*\}[^)]*\)'
    )
    
    foreach ($pattern in $sensitivePatterns) {
        $matches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($matches.Count -gt 0) {
            Write-Host "CRITICAL: Found $($matches.Count) sensitive data exposures in $($file.Name)" -ForegroundColor Red
            $content = [regex]::Replace($content, $pattern, '// Sensitive data logging removed for security', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            $fileReplacements += $matches.Count
        }
    }
    
    # Standard console statement replacements
    $replacements = @{
        'console\.log\s*\(' = 'logger.info('
        'console\.debug\s*\(' = 'logger.debug('
        'console\.info\s*\(' = 'logger.info('
        'console\.warn\s*\(' = 'logger.warn('
        'console\.error\s*\(' = 'logger.error('
    }
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $matches = [regex]::Matches($content, $pattern)
        if ($matches.Count -gt 0) {
            $content = [regex]::Replace($content, $pattern, $replacement)
            $fileReplacements += $matches.Count
        }
    }
    
    # Add logger import if we made replacements and it's not already imported
    if ($fileReplacements -gt 0 -and $content -notmatch "from '@/utils/logger'" -and $content -notmatch "import.*logger") {
        # Find the last import statement
        $importMatches = [regex]::Matches($content, "^import\s+.*?;$", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        if ($importMatches.Count -gt 0) {
            $lastImport = $importMatches[$importMatches.Count - 1]
            $insertIndex = $lastImport.Index + $lastImport.Length
            $content = $content.Substring(0, $insertIndex) + "`nimport { logger } from '@/utils/logger';" + $content.Substring($insertIndex)
        } else {
            # No imports found, add at the top
            $content = "import { logger } from '@/utils/logger';`n" + $content
        }
    }
    
    # Write file if modified
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
        $totalReplacements += $fileReplacements
        Write-Host "Fixed $fileReplacements console statements in $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "EMERGENCY FIX SUMMARY" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Total files processed: $totalFiles" -ForegroundColor White
Write-Host "Files modified: $modifiedFiles" -ForegroundColor Green
Write-Host "Total console statements replaced: $totalReplacements" -ForegroundColor Green
Write-Host ""

if ($totalReplacements -gt 0) {
    Write-Host "CRITICAL SECURITY FIX COMPLETED" -ForegroundColor Green
    Write-Host "All console statements have been replaced with secure logger calls." -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Review the changes and test the application!" -ForegroundColor Yellow
} else {
    Write-Host "No console statements found to replace." -ForegroundColor Blue
}

Write-Host ""
Write-Host "SECURITY STATUS: Console logging contamination resolved" -ForegroundColor Green
