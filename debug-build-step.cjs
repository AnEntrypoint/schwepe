console.log('🚀 Script started');

const fs = require('fs');
console.log('✓ fs required');

const path = require('path');
console.log('✓ path required');

console.log('✅ All imports successful');

console.log('About to get process.cwd()');
const projectRoot = process.cwd();
console.log('✓ process.cwd() worked:', projectRoot);

console.log('About to join paths');
const distPath = path.join(projectRoot, 'dist');
console.log('✓ path.join worked:', distPath);

console.log('About to check if dist exists');
const distExists = fs.existsSync(distPath);
console.log('✓ fs.existsSync worked, dist exists:', distExists);

console.log('🎉 Debug script completed successfully!');

