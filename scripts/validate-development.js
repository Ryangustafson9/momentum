#!/usr/bin/env node

/**
 * 🚀 MOMENTUM APP V2.0 - DEVELOPMENT VALIDATION SCRIPT
 * 
 * This script validates that the development environment is properly configured
 * and that all essential components are in place for testing.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

console.log('🚀 MOMENTUM APP V2.0 - DEVELOPMENT VALIDATION');
console.log('=' .repeat(60));

/**
 * Check if essential files exist
 */
const checkEssentialFiles = () => {
  console.log('📁 Checking essential files...');
  
  const essentialFiles = [
    'package.json',
    'vite.config.js',
    'src/App.jsx',
    'src/main.jsx',
    'src/pages/joinOnline.jsx',
    'src/pages/Login.jsx',
    'src/pages/member-portal/MemberDashboard.jsx',
    'src/pages/staff-portal/Dashboard.jsx',
    'src/contexts/AuthContext.jsx',
    'src/lib/supabaseClient.js',
    'src/utils/roleUtils.js',
    'src/utils/gymBranding.js',
    '.env',
    '.env.example'
  ];
  
  const results = {};
  
  essentialFiles.forEach(file => {
    const filePath = join(ROOT_DIR, file);
    const exists = existsSync(filePath);
    results[file] = exists;
    
    if (exists) {
      const stats = statSync(filePath);
      const isRecent = Date.now() - stats.mtime.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
      console.log(`  ✅ ${file} ${isRecent ? '(recently modified)' : ''}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
    }
  });
  
  return results;
};

/**
 * Validate package.json configuration
 */
const validatePackageJson = () => {
  console.log('\n📦 Validating package.json...');
  
  try {
    const packagePath = join(ROOT_DIR, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
      'tailwindcss'
    ];
    
    console.log('  Required dependencies:');
    requiredDeps.forEach(dep => {
      const hasInDeps = packageJson.dependencies?.[dep];
      const hasInDevDeps = packageJson.devDependencies?.[dep];
      
      if (hasInDeps || hasInDevDeps) {
        console.log(`    ✅ ${dep}: ${hasInDeps || hasInDevDeps}`);
      } else {
        console.log(`    ❌ ${dep} - MISSING`);
      }
    });
    
    console.log('  Scripts:');
    const requiredScripts = ['dev', 'build', 'preview'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts?.[script]) {
        console.log(`    ✅ ${script}: ${packageJson.scripts[script]}`);
      } else {
        console.log(`    ❌ ${script} - MISSING`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`  ❌ Error reading package.json: ${error.message}`);
    return false;
  }
};

/**
 * Check environment configuration
 */
const checkEnvironmentConfig = () => {
  console.log('\n🌍 Checking environment configuration...');
  
  try {
    const envPath = join(ROOT_DIR, '.env');
    const envExamplePath = join(ROOT_DIR, '.env.example');
    
    if (!existsSync(envPath)) {
      console.log('  ❌ .env file not found');
      return false;
    }
    
    if (!existsSync(envExamplePath)) {
      console.log('  ⚠️  .env.example file not found (recommended)');
    }
    
    const envContent = readFileSync(envPath, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_APP_NAME'
    ];
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        const hasValue = envContent.includes(`${varName}=`) && 
                        !envContent.includes(`${varName}=your_`) &&
                        !envContent.includes(`${varName}=`) === false;
        console.log(`    ${hasValue ? '✅' : '⚠️'} ${varName} ${hasValue ? '' : '(needs value)'}`);
      } else {
        console.log(`    ❌ ${varName} - MISSING`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`  ❌ Error checking environment: ${error.message}`);
    return false;
  }
};

/**
 * Validate source code structure
 */
const validateSourceStructure = () => {
  console.log('\n🏗️  Validating source code structure...');
  
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/contexts',
    'src/hooks',
    'src/utils',
    'src/lib',
    'src/tests'
  ];
  
  requiredDirs.forEach(dir => {
    const dirPath = join(ROOT_DIR, dir);
    if (existsSync(dirPath)) {
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ❌ ${dir}/ - MISSING`);
    }
  });
  
  return true;
};

/**
 * Check recent code changes
 */
const checkRecentChanges = () => {
  console.log('\n📝 Checking recent changes...');
  
  const keyFiles = [
    'src/pages/joinOnline.jsx',
    'src/pages/member-portal/MemberDashboard.jsx',
    'src/components/admin/AdminSidebar.jsx',
    'src/App.jsx'
  ];
  
  keyFiles.forEach(file => {
    const filePath = join(ROOT_DIR, file);
    if (existsSync(filePath)) {
      const stats = statSync(filePath);
      const modifiedTime = stats.mtime;
      const isRecent = Date.now() - modifiedTime.getTime() < 24 * 60 * 60 * 1000; // 24 hours
      
      console.log(`  ${isRecent ? '🔥' : '📄'} ${file} (${modifiedTime.toLocaleDateString()})`);
    }
  });
  
  return true;
};

/**
 * Generate development summary
 */
const generateSummary = (results) => {
  console.log('\n📊 DEVELOPMENT VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  
  const allFilesExist = Object.values(results.files).every(exists => exists);
  const configValid = results.package && results.environment;
  const structureValid = results.structure;
  
  console.log(`Files: ${allFilesExist ? '✅ All essential files present' : '❌ Some files missing'}`);
  console.log(`Config: ${configValid ? '✅ Configuration valid' : '❌ Configuration issues'}`);
  console.log(`Structure: ${structureValid ? '✅ Source structure valid' : '❌ Structure issues'}`);
  
  const overallStatus = allFilesExist && configValid && structureValid;
  
  console.log(`\n🎯 Overall Status: ${overallStatus ? '✅ READY FOR TESTING' : '❌ NEEDS ATTENTION'}`);
  
  if (overallStatus) {
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:5173');
    console.log('3. Test: /join-online signup flow');
    console.log('4. Test: /login authentication');
    console.log('5. Test: Member and staff portals');
    console.log('6. Review: docs/v2-testing-checklist.md');
  } else {
    console.log('\n⚠️  Issues to address:');
    console.log('- Fix missing files and configuration');
    console.log('- Ensure all dependencies are installed');
    console.log('- Verify environment variables are set');
  }
  
  return overallStatus;
};

/**
 * Main validation function
 */
const runValidation = () => {
  const results = {
    files: checkEssentialFiles(),
    package: validatePackageJson(),
    environment: checkEnvironmentConfig(),
    structure: validateSourceStructure(),
    changes: checkRecentChanges()
  };
  
  return generateSummary(results);
};

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}

export { runValidation };
