
import fs from 'fs';
import path from 'path';

console.log('Starting minimal build...');

// Create dist directory
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create minimal index.html
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Schwepe</title>
</head>
<body>
  <h1>Schwepe Application</h1>
  <p>Build successful</p>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
console.log('✅ Minimal build completed');
