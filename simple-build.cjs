console.log('🚀 Starting simple build...');

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
console.log('Working in:', projectRoot);

// Create dist directory
const distPath = path.join(projectRoot, 'dist');
console.log('Creating dist directory:', distPath);

try {
  if (fs.existsSync(distPath)) {
    console.log('Dist exists, removing...');
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  fs.mkdirSync(distPath, { recursive: true });
  console.log('✅ Dist directory created');
} catch (error) {
  console.error('❌ Error creating dist:', error.message);
  process.exit(1);
}

// Create a simple test file
const testFile = path.join(distPath, 'test.txt');
fs.writeFileSync(testFile, 'Build successful at ' + new Date().toISOString());
console.log('✅ Test file created');

console.log('🎉 Simple build completed successfully!');

