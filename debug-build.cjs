#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug build process started');
console.log('Current directory:', process.cwd());

try {
  // Step 1: Check basic directory structure
  console.log('\n1. Checking directory structure...');
  const sitesDir = path.join(process.cwd(), 'sites');
  console.log('Sites directory exists:', fs.existsSync(sitesDir));
  
  if (fs.existsSync(sitesDir)) {
    const sites = fs.readdirSync(sitesDir);
    console.log('Sites found:', sites);
  }

  // Step 2: Test simple directory creation
  console.log('\n2. Testing dist directory creation...');
  const distDir = path.join(process.cwd(), 'dist-test');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✓ Dist directory created successfully');

  // Step 3: Test file copy
  console.log('\n3. Testing file copy...');
  const testFile = path.join(distDir, 'test.txt');
  fs.writeFileSync(testFile, 'Hello World');
  const content = fs.readFileSync(testFile, 'utf8');
  console.log('✓ File copy test successful, content:', content);

  // Step 4: Clean up
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log('✓ Cleanup successful');

  console.log('\n🎉 All debug tests passed!');
  
} catch (error) {
  console.error('❌ Debug test failed:', error.message);
  console.error('Stack:', error.stack);
}

