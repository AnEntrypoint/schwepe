// Fix build permissions and add proper error handling
import fs from 'fs';
import path from 'path';

// Fix the backup directory permissions issue
const backupDir = path.join(process.cwd(), 'dist-backup');
const distDir = path.join(process.cwd(), 'dist');

try {
  // Ensure backup directory exists with proper permissions
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o755 });
  }
  
  // Fix permissions on existing directories
  if (fs.existsSync(backupDir)) {
    fs.chmodSync(backupDir, 0o755);
  }
  
  if (fs.existsSync(distDir)) {
    fs.chmodSync(distDir, 0o755);
  }
  
  console.log('✅ Fixed directory permissions');
} catch (error) {
  console.error('❌ Error fixing permissions:', error.message);
  process.exit(1);
}
