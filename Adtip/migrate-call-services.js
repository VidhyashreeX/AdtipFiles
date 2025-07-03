#!/usr/bin/env node

/**
 * Migration Script: Consolidate Call Services
 * 
 * This script:
 * 1. Updates all imports to use UnifiedCallService
 * 2. Replaces service method calls
 * 3. Creates backup files for safety
 * 4. Removes deprecated service files
 */

const fs = require('fs');
const path = require('path');

// Files to be deprecated and removed
const DEPRECATED_FILES = [
  'src/services/calling/CallManager.ts',
  'src/services/calling/CallService.ts', // Note: there's also src/services/CallService.ts - keep the main one
  'src/services/calling/CallSyncService.ts',
  'src/services/calling/CallNotificationHandler.ts',
  'src/services/calling/WhatsAppCallNotificationService.ts',
  // Keep WhatsAppCallManager.ts as it's being replaced by UnifiedCallService
  // Keep CallMediaManager.ts as it's still used by UnifiedCallService
];

// Import replacements mapping
const IMPORT_REPLACEMENTS = {
  "import WhatsAppCallManager from '../../services/calling/WhatsAppCallManager';": "import UnifiedCallService from '../../services/calling/UnifiedCallService';",
  "import WhatsAppCallManager from './services/calling/WhatsAppCallManager';": "import UnifiedCallService from './services/calling/UnifiedCallService';",
  "import CallManager from '../../services/calling/CallManager';": "import UnifiedCallService from '../../services/calling/UnifiedCallService';",
  "import CallManager from './services/calling/CallManager';": "import UnifiedCallService from './services/calling/UnifiedCallService';",
  "import CallSyncService from '../../services/calling/CallSyncService';": "import UnifiedCallService from '../../services/calling/UnifiedCallService';",
  "import CallSyncService from './services/calling/CallSyncService';": "import UnifiedCallService from './services/calling/UnifiedCallService';",
  "import CallNotificationHandler from '../../services/calling/CallNotificationHandler';": "import UnifiedCallService from '../../services/calling/UnifiedCallService';",
  "import CallNotificationHandler from './services/calling/CallNotificationHandler';": "import UnifiedCallService from './services/calling/UnifiedCallService';",
  "import WhatsAppCallNotificationService from '../../services/calling/WhatsAppCallNotificationService';": "import UnifiedCallService from '../../services/calling/UnifiedCallService';",
  "import WhatsAppCallNotificationService from './services/calling/WhatsAppCallNotificationService';": "import UnifiedCallService from './services/calling/UnifiedCallService';",
};

// Service instance replacements
const SERVICE_REPLACEMENTS = {
  "WhatsAppCallManager.getInstance()": "UnifiedCallService.getInstance()",
  "CallManager.getInstance()": "UnifiedCallService.getInstance()",
  "CallSyncService.getInstance()": "UnifiedCallService.getInstance()",
  "CallNotificationHandler.getInstance()": "UnifiedCallService.getInstance()",
  "WhatsAppCallNotificationService.getInstance()": "UnifiedCallService.getInstance()",
};

console.log('🚀 Starting Call Service Consolidation Migration...\n');

// Function to find all TypeScript and TSX files
function findTSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findTSFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to create backup
function createBackup(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  console.log(`📋 Created backup: ${backupPath}`);
}

// Function to update file content
function updateFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file contains any of our target imports/services
    const hasTargetImports = Object.keys(IMPORT_REPLACEMENTS).some(importStr => content.includes(importStr));
    const hasTargetServices = Object.keys(SERVICE_REPLACEMENTS).some(serviceStr => content.includes(serviceStr));
    
    if (!hasTargetImports && !hasTargetServices) {
      return false; // No changes needed
    }
    
    // Create backup before modifying
    createBackup(filePath);
    
    // Replace imports
    for (const [oldImport, newImport] of Object.entries(IMPORT_REPLACEMENTS)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        modified = true;
        console.log(`  ↻ Updated import in ${filePath}`);
      }
    }
    
    // Replace service instances
    for (const [oldService, newService] of Object.entries(SERVICE_REPLACEMENTS)) {
      if (content.includes(oldService)) {
        content = content.replace(new RegExp(oldService.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newService);
        modified = true;
        console.log(`  ↻ Updated service call in ${filePath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to move deprecated files
function moveDeprecatedFiles() {
  const deprecatedDir = path.join(process.cwd(), 'src', 'services', 'calling', '_deprecated');
  
  if (!fs.existsSync(deprecatedDir)) {
    fs.mkdirSync(deprecatedDir, { recursive: true });
    console.log(`📁 Created deprecated directory: ${deprecatedDir}`);
  }
  
  for (const filePath of DEPRECATED_FILES) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      // Create backup first
      createBackup(fullPath);
      
      // Move to deprecated folder
      const fileName = path.basename(fullPath);
      const deprecatedPath = path.join(deprecatedDir, fileName);
      
      fs.renameSync(fullPath, deprecatedPath);
      console.log(`🗃️  Moved to deprecated: ${filePath} -> ${deprecatedPath}`);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }
}

// Main migration function
function runMigration() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  console.log(`📂 Scanning files in: ${srcDir}\n`);
  
  // Find all TypeScript files
  const tsFiles = findTSFiles(srcDir);
  console.log(`📄 Found ${tsFiles.length} TypeScript files\n`);
  
  let updatedCount = 0;
  
  // Update each file
  for (const filePath of tsFiles) {
    // Skip files that are being deprecated
    const relativePath = path.relative(projectRoot, filePath);
    if (DEPRECATED_FILES.includes(relativePath.replace(/\\/g, '/'))) {
      console.log(`⏭️  Skipping deprecated file: ${relativePath}`);
      continue;
    }
    
    if (updateFileContent(filePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✅ Updated ${updatedCount} files\n`);
  
  // Move deprecated files
  console.log('🗃️  Moving deprecated files...\n');
  moveDeprecatedFiles();
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • Updated ${updatedCount} files to use UnifiedCallService`);
  console.log(`   • Moved ${DEPRECATED_FILES.length} deprecated files to _deprecated folder`);
  console.log(`   • Created backup files for all modified files`);
  console.log('\n⚠️  Next steps:');
  console.log('   1. Test the application thoroughly');
  console.log('   2. Update any remaining manual references');
  console.log('   3. Remove .backup files once satisfied');
  console.log('   4. Delete _deprecated folder when no longer needed');
}

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
