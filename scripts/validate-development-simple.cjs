const { readFileSync, existsSync, statSync } = require('fs');
const { join } = require('path');

/**
 * 🚀 MOMENTUM APP V2.0 - DEVELOPMENT VALIDATION SCRIPT
 * 
 * This script validates that the development environment is properly configured
 * and that all essential components are in place for testing.
 */

const ROOT_DIR = process.cwd();

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
    '.env'
  ];
  
  const results = {};
  let existingCount = 0;
  
  essentialFiles.forEach(file => {
    const filePath = join(ROOT_DIR, file);
    const exists = existsSync(filePath);
    results[file] = exists;
    
    if (exists) {
      existingCount++;
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
    }
  });
  
  console.log(`  📊 ${existingCount}/${essentialFiles.length} essential files found`);
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
      'lucide-react'
    ];
    
    console.log('  Dependencies:');
    let depCount = 0;
    requiredDeps.forEach(dep => {
      const hasInDeps = packageJson.dependencies?.[dep];
      const hasInDevDeps = packageJson.devDependencies?.[dep];
      
      if (hasInDeps || hasInDevDeps) {
        depCount++;
        console.log(`    ✅ ${dep}`);
      } else {
        console.log(`    ❌ ${dep} - MISSING`);
      }
    });
    
    console.log('  Scripts:');
    const requiredScripts = ['dev', 'build'];
    let scriptCount = 0;
    requiredScripts.forEach(script => {
      if (packageJson.scripts?.[script]) {
        scriptCount++;
        console.log(`    ✅ ${script}`);
      } else {
        console.log(`    ❌ ${script} - MISSING`);
      }
    });
    
    console.log(`  📊 ${depCount}/${requiredDeps.length} dependencies, ${scriptCount}/${requiredScripts.length} scripts`);
    return depCount >= requiredDeps.length - 1 && scriptCount >= requiredScripts.length;
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
    
    if (!existsSync(envPath)) {
      console.log('  ❌ .env file not found');
      return false;
    }
    
    console.log('  ✅ .env file exists');
    
    const envContent = readFileSync(envPath, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    let varCount = 0;
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        varCount++;
        console.log(`    ✅ ${varName}`);
      } else {
        console.log(`    ❌ ${varName} - MISSING`);
      }
    });
    
    console.log(`  📊 ${varCount}/${requiredVars.length} environment variables found`);
    return varCount >= requiredVars.length;
  } catch (error) {
    console.log(`  ❌ Error checking environment: ${error.message}`);
    return false;
  }
};

/**
 * Check recent code changes for V2.0
 */
const checkV2Changes = () => {
  console.log('\n📝 Checking V2.0 implementation...');
  
  const v2Files = [
    'src/pages/joinOnline.jsx',
    'src/tests/e2e-user-flows.test.js',
    'src/tests/browser-test-runner.js',
    'docs/v2-testing-checklist.md'
  ];
  
  let v2Count = 0;
  v2Files.forEach(file => {
    const filePath = join(ROOT_DIR, file);
    if (existsSync(filePath)) {
      v2Count++;
      const stats = statSync(filePath);
      const isRecent = Date.now() - stats.mtime.getTime() < 24 * 60 * 60 * 1000;
      console.log(`  ✅ ${file} ${isRecent ? '(recent)' : ''}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
    }
  });
  
  console.log(`  📊 ${v2Count}/${v2Files.length} V2.0 files implemented`);
  return v2Count >= v2Files.length;
};

/**
 * Generate development summary
 */
const generateSummary = (results) => {
  console.log('\n📊 DEVELOPMENT VALIDATION SUMMARY');
  console.log('=' .repeat(60));
  
  const filesOk = Object.values(results.files).filter(exists => exists).length >= 10;
  const configOk = results.package && results.environment;
  const v2Ok = results.v2Implementation;
  
  console.log(`📁 Files: ${filesOk ? '✅ Essential files present' : '❌ Missing files'}`);
  console.log(`📦 Config: ${configOk ? '✅ Configuration valid' : '❌ Configuration issues'}`);
  console.log(`🚀 V2.0: ${v2Ok ? '✅ V2.0 features implemented' : '❌ V2.0 incomplete'}`);
  
  const overallStatus = filesOk && configOk && v2Ok;
  
  console.log(`\n🎯 Overall Status: ${overallStatus ? '✅ READY FOR TESTING' : '⚠️  NEEDS ATTENTION'}`);
  
  if (overallStatus) {
    console.log('\n🧪 TESTING INSTRUCTIONS:');
    console.log('1. Ensure dev server is running: npm run dev');
    console.log('2. Open browser to: http://localhost:5177 (or assigned port)');
    console.log('3. Test signup flow: Navigate to /join-online');
    console.log('4. Test authentication: Navigate to /login');
    console.log('5. Test member portal: After login as member');
    console.log('6. Test staff portal: After login as staff/admin');
    console.log('7. Review checklist: docs/v2-testing-checklist.md');
    console.log('8. Run browser tests: Copy/paste browser-test-runner.js in console');
  } else {
    console.log('\n⚠️  ISSUES TO FIX:');
    if (!filesOk) console.log('  - Install missing dependencies: npm install');
    if (!configOk) console.log('  - Check .env configuration');
    if (!v2Ok) console.log('  - Complete V2.0 implementation');
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
    v2Implementation: checkV2Changes()
  };
  
  return generateSummary(results);
};

// Run validation
runValidation();
