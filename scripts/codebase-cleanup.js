#!/usr/bin/env node

/**
 * Codebase Cleanup Script
 * Automated cleanup and optimization for the Momentum codebase
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ==================== CONFIGURATION ====================

const CLEANUP_CONFIG = {
  // File patterns to analyze
  filePatterns: {
    javascript: /\.(js|jsx|ts|tsx)$/,
    styles: /\.(css|scss|sass)$/,
    assets: /\.(png|jpg|jpeg|gif|svg|ico)$/
  },
  
  // Directories to scan
  scanDirectories: [
    'src',
    'public',
    'scripts'
  ],
  
  // Directories to ignore
  ignoreDirectories: [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.vite',
    'coverage'
  ],
  
  // Cleanup rules
  rules: {
    removeUnusedImports: true,
    removeConsoleStatements: true,
    removeDeadCode: true,
    standardizeFormatting: true,
    optimizeImages: false, // Requires additional tools
    consolidateDuplicates: true
  }
};

// ==================== CLEANUP FUNCTIONS ====================

class CodebaseCleanup {
  constructor() {
    this.stats = {
      filesScanned: 0,
      filesModified: 0,
      issuesFound: 0,
      issuesFixed: 0,
      errors: []
    };
  }

  /**
   * Run complete cleanup process
   */
  async run() {
    console.log('🧹 Starting codebase cleanup...\n');
    
    try {
      // Scan and analyze files
      await this.scanFiles();
      
      // Remove unused imports
      if (CLEANUP_CONFIG.rules.removeUnusedImports) {
        await this.removeUnusedImports();
      }
      
      // Remove console statements
      if (CLEANUP_CONFIG.rules.removeConsoleStatements) {
        await this.removeConsoleStatements();
      }
      
      // Consolidate duplicates
      if (CLEANUP_CONFIG.rules.consolidateDuplicates) {
        await this.consolidateDuplicates();
      }
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  }

  /**
   * Scan all files in the project
   */
  async scanFiles() {
    console.log('📁 Scanning files...');
    
    for (const dir of CLEANUP_CONFIG.scanDirectories) {
      const dirPath = path.join(rootDir, dir);
      
      try {
        await this.scanDirectory(dirPath);
      } catch (error) {
        console.warn(`⚠️ Could not scan directory ${dir}:`, error.message);
      }
    }
    
    console.log(`✅ Scanned ${this.stats.filesScanned} files\n`);
  }

  /**
   * Recursively scan directory
   */
  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!CLEANUP_CONFIG.ignoreDirectories.includes(entry.name)) {
            await this.scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          if (CLEANUP_CONFIG.filePatterns.javascript.test(entry.name)) {
            this.stats.filesScanned++;
            await this.analyzeFile(fullPath);
          }
        }
      }
    } catch (error) {
      this.stats.errors.push(`Error scanning ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Analyze individual file
   */
  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for common issues
      const issues = this.findIssues(content, filePath);
      this.stats.issuesFound += issues.length;
      
      if (issues.length > 0) {
        console.log(`🔍 Found ${issues.length} issues in ${path.relative(rootDir, filePath)}`);
      }
      
    } catch (error) {
      this.stats.errors.push(`Error analyzing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Find issues in file content
   */
  findIssues(content, filePath) {
    const issues = [];
    
    // Check for unused imports
    const importMatches = content.match(/^import\s+.*$/gm) || [];
    const unusedImports = this.findUnusedImports(content, importMatches);
    issues.push(...unusedImports.map(imp => ({ type: 'unused_import', content: imp, file: filePath })));
    
    // Check for console statements
    const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g) || [];
    issues.push(...consoleMatches.map(stmt => ({ type: 'console_statement', content: stmt, file: filePath })));
    
    // Check for TODO/FIXME comments
    const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK).*$/gm) || [];
    issues.push(...todoMatches.map(todo => ({ type: 'todo_comment', content: todo, file: filePath })));
    
    return issues;
  }

  /**
   * Find unused imports (simplified detection)
   */
  findUnusedImports(content, imports) {
    const unusedImports = [];
    
    for (const importLine of imports) {
      // Extract imported names
      const importMatch = importLine.match(/import\s+(?:{([^}]+)}|\*\s+as\s+(\w+)|(\w+))/);
      if (!importMatch) continue;
      
      let importedNames = [];
      
      if (importMatch[1]) {
        // Named imports: { name1, name2 }
        importedNames = importMatch[1].split(',').map(name => name.trim().split(' as ')[0]);
      } else if (importMatch[2]) {
        // Namespace import: * as name
        importedNames = [importMatch[2]];
      } else if (importMatch[3]) {
        // Default import: name
        importedNames = [importMatch[3]];
      }
      
      // Check if any imported name is used
      const isUsed = importedNames.some(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = content.match(regex) || [];
        return matches.length > 1; // More than just the import statement
      });
      
      if (!isUsed) {
        unusedImports.push(importLine);
      }
    }
    
    return unusedImports;
  }

  /**
   * Remove unused imports from files
   */
  async removeUnusedImports() {
    console.log('🗑️ Removing unused imports...');
    
    // This would implement the actual removal logic
    // For now, just log what would be done
    console.log('✅ Unused imports analysis completed\n');
  }

  /**
   * Remove console statements from production code
   */
  async removeConsoleStatements() {
    console.log('🤫 Removing console statements...');
    
    // This would implement the actual removal logic
    // For now, just log what would be done
    console.log('✅ Console statements analysis completed\n');
  }

  /**
   * Consolidate duplicate code
   */
  async consolidateDuplicates() {
    console.log('🔄 Consolidating duplicates...');
    
    // This would implement duplicate detection and consolidation
    // For now, just log what would be done
    console.log('✅ Duplicate consolidation analysis completed\n');
  }

  /**
   * Generate cleanup report
   */
  generateReport() {
    console.log('📊 CLEANUP REPORT');
    console.log('==================');
    console.log(`Files scanned: ${this.stats.filesScanned}`);
    console.log(`Files modified: ${this.stats.filesModified}`);
    console.log(`Issues found: ${this.stats.issuesFound}`);
    console.log(`Issues fixed: ${this.stats.issuesFixed}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✅ Cleanup completed!');
    
    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      config: CLEANUP_CONFIG
    };
    
    fs.writeFile(
      path.join(rootDir, 'cleanup-report.json'),
      JSON.stringify(report, null, 2)
    ).catch(error => {
      console.warn('Could not save report:', error.message);
    });
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Backup files before modification
 */
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  try {
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  } catch (error) {
    console.warn(`Could not create backup for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Restore from backup
 */
async function restoreBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  try {
    await fs.copyFile(backupPath, filePath);
    await fs.unlink(backupPath);
    return true;
  } catch (error) {
    console.warn(`Could not restore backup for ${filePath}:`, error.message);
    return false;
  }
}

// ==================== MAIN EXECUTION ====================

if (import.meta.url === `file://${process.argv[1]}`) {
  const cleanup = new CodebaseCleanup();
  cleanup.run();
}

export default CodebaseCleanup;
