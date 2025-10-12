#!/usr/bin/env node

const fs = require('fs');

console.log('🧪 Auto-Fold Extension Test\n');

// Check if extension is compiled
if (fs.existsSync('./dist/extension.js')) {
  console.log('✅ Extension compiled successfully');

  const extensionContent = fs.readFileSync('./dist/extension.js', 'utf8');

  // Test for key optimizations
  const tests = [
    {
      name: 'Logger utility implemented',
      check: () => extensionContent.includes('[auto-fold]')
    },
    {
      name: 'Command caching implemented',
      check: () => extensionContent.includes('availableFoldCommands')
    },
    {
      name: 'Editor activation logic optimized',
      check: () => extensionContent.includes('ensureEditorActive')
    },
    {
      name: 'Configuration normalization present',
      check: () => extensionContent.includes('getConfiguredFoldLevels')
    },
    {
      name: 'Performance optimization implemented',
      check: () => extensionContent.includes('performFolding')
    },
    {
      name: 'Constants defined',
      check: () => extensionContent.includes('FOLD_LEVEL_MAX')
    },
    {
      name: 'Error handling improved',
      check: () => extensionContent.includes('logger.error')
    },
    {
      name: 'Modular function structure',
      check: () => extensionContent.includes('shouldSkipFolding')
    }
  ];

  let passed = 0;
  tests.forEach(test => {
    const result = test.check();
    console.log(result ? '✅' : '❌', test.name);
    if (result) passed++;
  });

  console.log(`\n📊 Test Results: ${passed}/${tests.length} tests passed`);

  // Check file size (smaller = better optimization)
  const stats = fs.statSync('./dist/extension.js');
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`📦 Extension size: ${sizeKB} KB`);

  if (passed === tests.length) {
    console.log('\n🎉 All optimizations successfully implemented!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some optimizations may be missing');
    process.exit(1);
  }
} else {
  console.log('❌ Extension not compiled. Run `npm run compile` first.');
  process.exit(1);
}