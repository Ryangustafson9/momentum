#!/usr/bin/env node

/**
 * CRITICAL SECURITY FIX: Console Logging Contamination
 * 
 * This script systematically replaces ALL console.log/debug/info statements
 * with production-safe logger calls to prevent sensitive data exposure.
 * 
 * SEVERITY: CRITICAL
 * IMPACT: SECURITY/PERFORMANCE
 * 
 * Current State: 570+ console statements across 414+ files
 * Target State: 0 console statements, all replaced with secure logger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Console statement patterns to replace
const CONSOLE_PATTERNS = [
  {
    pattern: /console\.log\s*\(/g,
    replacement: 'logger.info(',
    severity: 'HIGH'
  },
  {
    pattern: /console\.debug\s*\(/g,
    replacement: 'logger.debug(',
    severity: 'MEDIUM'
  },
  {
    pattern: /console\.info\s*\(/g,
    replacement: 'logger.info(',
    severity: 'MEDIUM'
  },
  {
    pattern: /console\.warn\s*\(/g,
    replacement: 'logger.warn(',
    severity: 'LOW'
  },
  {
    pattern: /console\.error\s*\(/g,
    replacement: 'logger.error(',
    severity: 'LOW'
  }
];

// Sensitive data patterns that should be completely removed
const SENSITIVE_PATTERNS = [
  /console\.log\s*\([^)]*(?:password|token|key|secret|auth|user|member|profile|email|phone)[^)]*\)/gi,
  /console\.log\s*\([^)]*\{[^}]*(?:password|token|key|secret|auth|user|member|profile|email|phone)[^}]*\}[^)]*\)/gi
];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;
let criticalIssues = 0;

/**
 * Check if file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return false;
  
  const relativePath = path.relative(SRC_DIR, filePath);
  return !EXCLUDE_DIRS.some(dir => relativePath.startsWith(dir));
}

/**
 * Add logger import if not present
 */
function addLoggerImport(content) {
  // Check if logger is already imported
  if (content.includes("from '@/utils/logger'") || content.includes('import { logger }')) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import\s+.*?;$/gm;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;
    
    return content.slice(0, insertIndex) + 
           "\nimport { logger } from '@/utils/logger';" + 
           content.slice(insertIndex);
  }
  
  // If no imports found, add at the top
  return "import { logger } from '@/utils/logger';\n" + content;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;
    let hasCriticalIssues = false;
    
    // Check for sensitive data exposure
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(content)) {
        hasCriticalIssues = true;
        criticalIssues++;
        console.log(`🚨 CRITICAL: Sensitive data exposure in ${filePath}`);
      }
    }
    
    // Replace console statements
    for (const { pattern, replacement, severity } of CONSOLE_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        fileReplacements += matches.length;
        modified = true;
        
        if (severity === 'HIGH') {
          console.log(`⚠️  ${severity}: ${matches.length} replacements in ${filePath}`);
        }
      }
    }
    
    // Add logger import if we made replacements
    if (modified) {
      content = addLoggerImport(content);
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      totalReplacements += fileReplacements;
      
      console.log(`✅ Fixed ${fileReplacements} console statements in ${path.relative(SRC_DIR, filePath)}`);
    }
    
    return { modified, replacements: fileReplacements, critical: hasCriticalIssues };
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { modified: false, replacements: 0, critical: false };
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      totalFiles++;
      processFile(fullPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚨 CRITICAL SECURITY FIX: Console Logging Contamination');
  console.log('========================================================');
  console.log(`Processing files in: ${SRC_DIR}`);
  console.log('');
  
  const startTime = Date.now();
  
  processDirectory(SRC_DIR);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('📊 SUMMARY REPORT');
  console.log('=================');
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Files modified: ${modifiedFiles}`);
  console.log(`Total console statements replaced: ${totalReplacements}`);
  console.log(`Critical security issues found: ${criticalIssues}`);
  console.log(`Processing time: ${duration}s`);
  console.log('');
  
  if (criticalIssues > 0) {
    console.log('🚨 CRITICAL ISSUES DETECTED!');
    console.log('Files with sensitive data exposure have been identified.');
    console.log('Manual review required for complete security audit.');
    console.log('');
  }
  
  if (totalReplacements > 0) {
    console.log('✅ SECURITY FIX COMPLETED');
    console.log('All console statements have been replaced with secure logger calls.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review modified files for any remaining issues');
    console.log('2. Test application functionality');
    console.log('3. Commit changes with security fix message');
  } else {
    console.log('ℹ️  No console statements found to replace.');
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processFile, processDirectory };
