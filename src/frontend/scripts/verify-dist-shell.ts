#!/usr/bin/env node
/**
 * Verification script to ensure the Vite build output is production-ready
 * and suitable for deployment to the Internet Computer frontend canister.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');

const REQUIRED_STATIC_FILES = [
  'manifest.webmanifest',
  'sw.js',
  'assets/generated/zizo-app-icon.dim_192x192.png',
  'assets/generated/zizo-app-icon.dim_512x512.png',
  'assets/generated/zizo-app-icon-maskable.dim_512x512.png',
];

let hasErrors = false;

console.log('🔍 Verifying Vite build output for production deployment...\n');

// Check if dist directory exists
if (!existsSync(DIST_DIR)) {
  console.error('❌ ERROR: dist/ directory not found!');
  console.error('   Run `npm run build` first.\n');
  process.exit(1);
}

// Check if index.html exists
if (!existsSync(INDEX_HTML)) {
  console.error('❌ ERROR: dist/index.html not found!');
  console.error('   The build output is incomplete.\n');
  process.exit(1);
}

// Read and verify index.html
const indexHtml = readFileSync(INDEX_HTML, 'utf-8');

// Check 1: Must NOT reference /src/main.tsx (development entry)
if (indexHtml.includes('/src/main.tsx')) {
  console.error('❌ ERROR: dist/index.html still references /src/main.tsx');
  console.error('   This is the development entry point and will not work in production.');
  console.error('   The build process did not transform index.html correctly.');
  console.error('   Ensure Vite is configured to build to dist/ with proper asset handling.\n');
  hasErrors = true;
} else {
  console.log('✅ index.html does not reference /src/main.tsx (development entry)');
}

// Check 2: Must reference /assets/* for bundled JavaScript
if (indexHtml.match(/\/assets\/index-[a-zA-Z0-9]+\.js/)) {
  console.log('✅ index.html references bundled JavaScript in /assets/');
} else {
  console.error('❌ ERROR: dist/index.html does not reference /assets/index-*.js');
  console.error('   The build output is missing the bundled JavaScript reference.');
  console.error('   Vite should transform the script tag to point to the bundled output.\n');
  hasErrors = true;
}

// Check 3: Verify required static files exist
console.log('\n📦 Checking required static files in dist/...');
for (const file of REQUIRED_STATIC_FILES) {
  const filePath = join(DIST_DIR, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ERROR: Missing required file: ${file}`);
    console.error(`   Expected at: ${filePath}`);
    console.error(`   Ensure this file exists in frontend/public/ before building.\n`);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ VERIFICATION FAILED');
  console.error('   The build output is NOT ready for deployment.');
  console.error('   Fix the errors above before deploying.');
  console.error('\n   Common fixes:');
  console.error('   - Ensure all required assets exist in frontend/public/');
  console.error('   - Run `npm run build` to regenerate dist/');
  console.error('   - Check that vite.config.ts has outDir: "dist"\n');
  process.exit(1);
} else {
  console.log('✅ VERIFICATION PASSED');
  console.log('   The build output is ready for deployment to the frontend canister.');
  console.log('   The dist/ directory contains all required files and references.');
  console.log('   Bundled assets are correctly referenced in /assets/\n');
  process.exit(0);
}
