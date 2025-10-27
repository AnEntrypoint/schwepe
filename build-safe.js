// Improved build script with better error handling
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

class SafeBuildProcess {
  constructor() {
    this.distDir = path.join(__dirname, 'dist');
    this.backupDir = path.join(__dirname, 'dist-backup');
  }

  // Ensure directories exist with proper permissions
  ensureDirectories() {
    try {
      // Create dist if it doesn't exist
      if (!fs.existsSync(this.distDir)) {
        fs.mkdirSync(this.distDir, { recursive: true, mode: 0o755 });
      }
      
      // Create and clear backup directory
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true, mode: 0o755 });
      } else {
        // Clear backup directory
        const files = fs.readdirSync(this.backupDir);
        for (const file of files) {
          const filePath = path.join(this.backupDir, file);
          fs.unlinkSync(filePath);
        }
      }
      
      console.log('✅ Directories prepared successfully');
      return true;
    } catch (error) {
      console.error('❌ Directory preparation failed:', error.message);
      return false;
    }
  }

  // Safe file copy with error handling
  safeCopy(src, dest) {
    try {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(\`✅ Copied \${path.basename(src)}\`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(\`❌ Failed to copy \${src}:\`, error.message);
      return false;
    }
  }

  // Run the original build process with fixes
  async build() {
    console.log('🚀 Starting safe build process...');
    
    if (!this.ensureDirectories()) {
      process.exit(1);
    }

    try {
      // Run the original build scripts
      console.log('📦 Running phrase build...');
      execSync('node build-process.js build', { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: { ...process.env, FORCE_SAFE_BUILD: 'true' }
      });
      
      console.log('📦 Running SSR build...');
      execSync('node build-ssr.js', { 
        stdio: 'inherit', 
        cwd: __dirname 
      });
      
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the safe build
const safeBuild = new SafeBuildProcess();
safeBuild.build();
