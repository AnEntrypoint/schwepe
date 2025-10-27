#!/usr/bin/env node

const fs = require('fs');

console.log('🚀 SCHWEPE DEPLOYMENT STATUS\n');

// Check latest deployment status
try {
  const deployStatus = JSON.parse(fs.readFileSync('/mnt/c/dev/schwepe/deployment-status.json', 'utf8'));
  console.log('📅 Last Check:', new Date(deployStatus.timestamp).toLocaleString());
  console.log('📊 Status:', deployStatus.status);
  
  if (deployStatus.status === 'deployment-success') {
    console.log('✅ DEPLOYMENT OPERATIONAL');
    console.log('🌐 Site:', deployStatus.urls.site);
    console.log('🔗 Actual URL:', deployStatus.urls.actualUrl);
    if (deployStatus.responseTimes) {
      console.log('⚡ Response Times:', deployStatus.responseTimes);
    }
  } else {
    console.log('❌ DEPLOYMENT ISSUES');
    console.log('🔧 Issue:', deployStatus.issue);
    console.log('🌐 Site:', deployStatus.urls.site);
    console.log('🔗 Coolify Admin:', deployStatus.urls.coolifyAdmin);
    if (deployStatus.nextSteps) {
      console.log('\n📋 Next Steps:');
      deployStatus.nextSteps.forEach(step => console.log('  •', step));
    }
  }
} catch (e) {
  console.log('❓ No deployment status found - running immediate check...');
}

// Check if fixes are ready
console.log('\n🔧 DEPLOYMENT FIXES STATUS:');
const fixes = [
  'Dockerfile.coolify',
  '.env.example', 
  'docker-compose.template.yml'
];

fixes.forEach(fix => {
  try {
    fs.accessSync('/mnt/c/dev/schwepe/' + fix);
    console.log(`✅ ${fix}`);
  } catch {
    console.log(`❌ ${fix} - missing`);
  }
});

console.log('\n🎯 COOLIFY CONFIGURATION NEEDED:');
console.log('1. Change Dockerfile to: Dockerfile.coolify');
console.log('2. Build Command: npm run build');
console.log('3. Start Command: npm start');
console.log('4. Environment: NODE_ENV=production');
console.log('5. Port: 3000');
console.log('6. Health Check: /api/health');
console.log('\n🌐 Coolify Admin: https://coolify.247420.xyz');