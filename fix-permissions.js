#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixing WSL file permissions...');

function fixPermissions(dir) {
  if (fs.existsSync(dir)) {
    try {
      execSync('find "' + dir + '" -type f -exec chmod 644 {} \\;', { stdio: 'inherit' });
      execSync('find "' + dir + '" -type d -exec chmod 755 {} \\;', { stdio: 'inherit' });
      console.log('✅ Fixed permissions for ' + dir);
    } catch (error) {
      console.log('Warning: Could not fix permissions for ' + dir + ':', error.message);
    }
  }
}

// Fix permissions for public directory
fixPermissions('./public');

// Fix permissions for dist directory if it exists
fixPermissions('./dist');

console.log('✅ Permission fixing completed.');
