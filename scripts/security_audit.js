#!/usr/bin/env node

/**
 * Security Audit Script
 * Scans the codebase for potential security vulnerabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Security patterns to check for
const SECURITY_PATTERNS = {
  'Admin API Calls': {
    pattern: /supabase\.auth\.admin\./g,
    severity: 'CRITICAL',
    description: 'Client-side admin API calls detected'
  },
  'Service Role Key': {
    pattern: /service_role.*key|SUPABASE_SERVICE_ROLE/gi,
    severity: 'CRITICAL',
    description: 'Service role key potentially exposed'
  },
  'Hardcoded Passwords': {
    pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'HIGH',
    description: 'Hardcoded password detected'
  },
  'SQL Injection Risk': {
    pattern: /\$\{.*\}.*\.(select|insert|update|delete|drop)/gi,
    severity: 'HIGH',
    description: 'Potential SQL injection vulnerability'
  },
  'Console.log in Production': {
    pattern: /console\.(log|debug|info)/g,
    severity: 'LOW',
    description: 'Console statements should be removed in production'
  }
};

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /\.env/,
  /\.log$/,
  /security_audit\.js$/,
  /SECURITY_FIXES\.md$/,
  /README\.md$/,  // Documentation files are safe
  /migrations/,   // Database migrations are server-side
  /scripts\/dev/, // Development scripts are not deployed
  /\.sql$/        // SQL files are server-side
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.sql', '.md'];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(projectRoot, fullPath);
    
    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Scan a file for security issues
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(projectRoot, filePath);
  const issues = [];
  
  for (const [name, config] of Object.entries(SECURITY_PATTERNS)) {
    const matches = [...content.matchAll(config.pattern)];
    
    for (const match of matches) {
      const lines = content.substring(0, match.index).split('\n');
      const lineNumber = lines.length;
      const lineContent = lines[lineNumber - 1].trim();
      
      issues.push({
        file: relativePath,
        line: lineNumber,
        severity: config.severity,
        issue: name,
        description: config.description,
        content: lineContent,
        match: match[0]
      });
    }
  }
  
  return issues;
}

/**
 * Main audit function
 */
function runSecurityAudit() {
  console.log('🔒 Running Security Audit...\n');
  
  const files = getAllFiles(projectRoot);
  const allIssues = [];
  
  console.log(`📁 Scanning ${files.length} files...\n`);
  
  for (const file of files) {
    const issues = scanFile(file);
    allIssues.push(...issues);
  }
  
  // Group issues by severity
  const issuesBySeverity = {
    CRITICAL: allIssues.filter(i => i.severity === 'CRITICAL'),
    HIGH: allIssues.filter(i => i.severity === 'HIGH'),
    MEDIUM: allIssues.filter(i => i.severity === 'MEDIUM'),
    LOW: allIssues.filter(i => i.severity === 'LOW')
  };
  
  // Report results
  console.log('📊 SECURITY AUDIT RESULTS');
  console.log('========================\n');
  
  let totalIssues = 0;
  
  for (const [severity, issues] of Object.entries(issuesBySeverity)) {
    if (issues.length === 0) continue;
    
    totalIssues += issues.length;
    const emoji = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🔵';
    
    console.log(`${emoji} ${severity} ISSUES (${issues.length})`);
    console.log('─'.repeat(40));
    
    for (const issue of issues) {
      console.log(`📄 ${issue.file}:${issue.line}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Code: ${issue.content}`);
      console.log(`   Match: "${issue.match}"`);
      console.log('');
    }
  }
  
  // Summary
  console.log('📋 SUMMARY');
  console.log('─'.repeat(40));
  
  if (totalIssues === 0) {
    console.log('✅ No security issues detected!');
    console.log('🎉 Codebase appears to be secure.');
  } else {
    console.log(`⚠️  Total issues found: ${totalIssues}`);
    console.log(`🔴 Critical: ${issuesBySeverity.CRITICAL.length}`);
    console.log(`🟠 High: ${issuesBySeverity.HIGH.length}`);
    console.log(`🟡 Medium: ${issuesBySeverity.MEDIUM.length}`);
    console.log(`🔵 Low: ${issuesBySeverity.LOW.length}`);
    
    if (issuesBySeverity.CRITICAL.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES MUST BE FIXED BEFORE PRODUCTION DEPLOYMENT!');
    }
  }
  
  console.log('\n🔒 Security audit completed.');
  
  // Exit with error code if critical issues found
  if (issuesBySeverity.CRITICAL.length > 0) {
    process.exit(1);
  }
}

// Run the audit
runSecurityAudit();
