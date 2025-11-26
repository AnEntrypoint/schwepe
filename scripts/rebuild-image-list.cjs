const fs = require('fs').promises;
const path = require('path');

async function rebuildImageList() {
  console.log('🖼 Rebuilding image list...');
  
  const imagesDir = path.join(__dirname, '../public/saved_images');
  const outputFile = path.join(__dirname, '../public/images.json');
  
  try {
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
    );
    
    const images = imageFiles.map(filename => ({
      filename: filename,
      path: 'saved_images/' + filename,
      type: 'image'
    }));
    
    await fs.writeFile(outputFile, JSON.stringify(images, null, 2));
    
    console.log('📸 Found ' + imageFiles.length + ' image files');
    console.log('✅ Generated images.json with ' + images.length + ' images');
    console.log('   Output: ' + outputFile);
  } catch (err) {
    console.error('❌ Error rebuilding image list:', err);
    process.exit(1);
  }
}

rebuildImageList();
