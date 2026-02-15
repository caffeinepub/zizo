#!/usr/bin/env node
/**
 * Verification script to ensure the frontend canister is correctly configured
 * to serve the Vite build output (dist/) as static assets.
 * 
 * This script reads the project's dfx.json configuration and validates that:
 * 1. The frontend canister is configured as type "assets"
 * 2. The source points to "frontend/dist" (not "frontend/src")
 * 3. The frontend canister depends on the backend canister
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DFX_JSON_PATH = join(process.cwd(), '..', 'dfx.json');

console.log('🔍 Verifying frontend canister configuration...\n');

// Check if dfx.json exists
if (!existsSync(DFX_JSON_PATH)) {
  console.error('❌ ERROR: dfx.json not found at project root!');
  console.error('   Expected location: ' + DFX_JSON_PATH);
  console.error('   This script must be run from the frontend/ directory.\n');
  process.exit(1);
}

// Read and parse dfx.json
let dfxConfig: any;
try {
  const dfxContent = readFileSync(DFX_JSON_PATH, 'utf-8');
  dfxConfig = JSON.parse(dfxContent);
} catch (error) {
  console.error('❌ ERROR: Failed to read or parse dfx.json');
  console.error('   ' + (error as Error).message + '\n');
  process.exit(1);
}

// Validate canisters configuration exists
if (!dfxConfig.canisters) {
  console.error('❌ ERROR: dfx.json does not contain "canisters" configuration');
  console.error('   The dfx.json file must define canister configurations.\n');
  process.exit(1);
}

// Validate frontend canister exists
if (!dfxConfig.canisters.frontend) {
  console.error('❌ ERROR: dfx.json does not contain "frontend" canister configuration');
  console.error('   Add a frontend canister configuration to dfx.json.\n');
  process.exit(1);
}

const frontendConfig = dfxConfig.canisters.frontend;
let hasErrors = false;

// Check 1: Frontend canister must be type "assets"
if (frontendConfig.type !== 'assets') {
  console.error('❌ ERROR: Frontend canister type is not "assets"');
  console.error(`   Current type: "${frontendConfig.type || 'undefined'}"`);
  console.error('   Required type: "assets"');
  console.error('\n   Fix: In dfx.json, set:');
  console.error('   "frontend": { "type": "assets", ... }\n');
  hasErrors = true;
} else {
  console.log('✅ Frontend canister type is "assets"');
}

// Check 2: Source must include "frontend/dist"
const sources = Array.isArray(frontendConfig.source) 
  ? frontendConfig.source 
  : (frontendConfig.source ? [frontendConfig.source] : []);

const hasDistSource = sources.some((src: string) => 
  src === 'frontend/dist' || src === 'dist' || src.endsWith('/dist')
);

const hasSrcSource = sources.some((src: string) => 
  src.includes('/src') || src === 'src'
);

if (!hasDistSource) {
  console.error('❌ ERROR: Frontend canister source does not include "frontend/dist"');
  console.error(`   Current source: ${JSON.stringify(sources)}`);
  console.error('   Required source: ["frontend/dist"]');
  console.error('\n   Fix: In dfx.json, set:');
  console.error('   "frontend": { "source": ["frontend/dist"], ... }');
  console.error('\n   This ensures the canister serves the built assets, not source files.\n');
  hasErrors = true;
} else {
  console.log('✅ Frontend canister source includes "frontend/dist"');
}

if (hasSrcSource) {
  console.error('❌ ERROR: Frontend canister source includes "/src" directory');
  console.error(`   Current source: ${JSON.stringify(sources)}`);
  console.error('   This will deploy source files instead of the production build!');
  console.error('   The deployed app will fail to load because /src/main.tsx is not bundled.');
  console.error('\n   Fix: In dfx.json, change source to:');
  console.error('   "frontend": { "source": ["frontend/dist"], ... }\n');
  hasErrors = true;
}

// Check 3: Frontend must depend on backend
const dependencies = Array.isArray(frontendConfig.dependencies) 
  ? frontendConfig.dependencies 
  : [];

if (!dependencies.includes('backend')) {
  console.error('⚠️  WARNING: Frontend canister does not depend on "backend"');
  console.error(`   Current dependencies: ${JSON.stringify(dependencies)}`);
  console.error('   Recommended: ["backend"]');
  console.error('\n   Fix: In dfx.json, set:');
  console.error('   "frontend": { "dependencies": ["backend"], ... }');
  console.error('\n   This ensures the backend is deployed before the frontend.\n');
  // This is a warning, not a hard error
  console.log('⚠️  Continuing despite missing backend dependency...\n');
} else {
  console.log('✅ Frontend canister depends on "backend"');
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ CONFIGURATION VERIFICATION FAILED');
  console.error('   The frontend canister is NOT correctly configured.');
  console.error('   Fix the errors above in dfx.json before deploying.');
  console.error('\n   Expected configuration:');
  console.error('   {');
  console.error('     "canisters": {');
  console.error('       "frontend": {');
  console.error('         "type": "assets",');
  console.error('         "source": ["frontend/dist"],');
  console.error('         "dependencies": ["backend"]');
  console.error('       }');
  console.error('     }');
  console.error('   }');
  console.error('\n   This configuration ensures:');
  console.error('   - The canister serves static assets (type: "assets")');
  console.error('   - Assets are loaded from the build output (source: ["frontend/dist"])');
  console.error('   - Backend is deployed first (dependencies: ["backend"])\n');
  process.exit(1);
} else {
  console.log('✅ CONFIGURATION VERIFICATION PASSED');
  console.log('   The frontend canister is correctly configured.');
  console.log('   Ready to deploy the production build to Internet Computer.\n');
  process.exit(0);
}
