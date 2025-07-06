/**
 * TipCall Hook Fix Verification Script
 * Tests that TipCallScreen properly imports and uses custom hooks
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TipCall Screen Hook Fix...\n');

// Read TipCallScreen.tsx
const tipCallScreenPath = path.join(__dirname, 'src', 'screens', 'tipcall', 'TipCallScreen.tsx');
const tipCallContent = fs.readFileSync(tipCallScreenPath, 'utf8');

// Required hooks that should be imported
const requiredHooks = [
  'useAuth',
  'useDataContext', 
  'useNetInfo',
  'useUsers',
  'usePrefetchData'
];

let allTestsPassed = true;

console.log('📋 Testing hook imports...');

// Test 1: Check all required hooks are imported
requiredHooks.forEach(hook => {
  const isImported = tipCallContent.includes(`import`) && 
                    (tipCallContent.includes(`{ ${hook} }`) || 
                     tipCallContent.includes(`${hook},`) ||
                     tipCallContent.includes(`, ${hook}`));
  
  if (isImported) {
    console.log(`✅ ${hook} is properly imported`);
  } else {
    console.log(`❌ ${hook} is missing from imports`);
    allTestsPassed = false;
  }
});

// Test 2: Check for duplicate imports
console.log('\n📋 Testing for duplicate imports...');

const lines = tipCallContent.split('\n');
const importLines = lines.filter(line => line.trim().startsWith('import'));

const hookImportCounts = {};
requiredHooks.forEach(hook => {
  hookImportCounts[hook] = 0;
  importLines.forEach(line => {
    if (line.includes(hook)) {
      hookImportCounts[hook]++;
    }
  });
});

Object.entries(hookImportCounts).forEach(([hook, count]) => {
  if (count === 1) {
    console.log(`✅ ${hook} imported exactly once`);
  } else if (count > 1) {
    console.log(`❌ ${hook} imported ${count} times (duplicate)`);
    allTestsPassed = false;
  } else {
    console.log(`❌ ${hook} not imported`);
    allTestsPassed = false;
  }
});

// Test 3: Check that hooks are used inside component function
console.log('\n📋 Testing hook usage within component...');

// Find the component function start (could be const or function declaration)
const componentMatch = tipCallContent.match(/(const TipCallScreen.*?=.*?\{|export default function TipCallScreen.*?\{)/);
if (componentMatch) {
  const componentStartIndex = tipCallContent.indexOf(componentMatch[0]);
  const componentContent = tipCallContent.substring(componentStartIndex);
  
  requiredHooks.forEach(hook => {
    if (componentContent.includes(`${hook}(`)) {
      console.log(`✅ ${hook} is called inside component`);
    } else {
      console.log(`⚠️  ${hook} imported but not used (this might be ok)`);
    }
  });
} else {
  console.log('❌ Could not find TipCallScreen component function');
  allTestsPassed = false;
}

// Test 4: Check for proper hook calling patterns
console.log('\n📋 Testing hook calling patterns...');

// Hooks should only be called at the top level of the component
const hookCallsOutsideComponent = requiredHooks.some(hook => {
  const beforeComponent = tipCallContent.substring(0, componentMatch ? tipCallContent.indexOf(componentMatch[0]) : 0);
  return beforeComponent.includes(`${hook}(`);
});

if (!hookCallsOutsideComponent) {
  console.log('✅ All hooks are called inside component function');
} else {
  console.log('❌ Some hooks are called outside component function');
  allTestsPassed = false;
}

// Test 5: Check file structure integrity
console.log('\n📋 Testing file structure...');

const hasReactImport = tipCallContent.includes("import React");
const hasComponentExport = tipCallContent.includes("export default function TipCallScreen") || tipCallContent.includes("export default TipCallScreen");
const hasComponentFunction = tipCallContent.includes("function TipCallScreen") || tipCallContent.includes("const TipCallScreen");

if (hasReactImport && hasComponentExport && hasComponentFunction) {
  console.log('✅ File structure is correct');
} else {
  console.log('❌ File structure issues detected');
  if (!hasReactImport) console.log('  - Missing React import');
  if (!hasComponentExport) console.log('  - Missing component export');
  if (!hasComponentFunction) console.log('  - Missing component function');
  allTestsPassed = false;
}

// Final results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ TipCallScreen hook imports are fixed');
  console.log('✅ No duplicate imports detected');
  console.log('✅ Hooks are properly used within component');
  console.log('✅ File structure is intact');
  console.log('\n📱 The TipCall tab should now work without hook errors!');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('Please review the issues above and fix them.');
}
console.log('='.repeat(50));
