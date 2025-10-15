#!/usr/bin/env node

/**
 * 修复损坏的图片文件
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 从缓存读取 DALL-E URLs
const CACHE_FILE = path.join(__dirname, '../.image-cache/image-cache.json');
const IMAGE_DIR = path.join(__dirname, '../src/assets/images/articles/real-world-asset-tokenization-complete-guide-for-investors');

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        console.log(`✅ Downloaded ${path.basename(filepath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
      
      response.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function fixImages() {
  try {
    // Read cache
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    
    // Find images for the article
    const articleImages = Object.entries(cache).filter(([key, value]) => 
      value.topic && value.topic.includes('Real World Asset Tokenization: Complete Guide')
    );
    
    if (articleImages.length === 0) {
      console.log('❌ No cached images found for this article');
      return;
    }
    
    console.log(`Found ${articleImages.length} cached images`);
    
    // Ensure directory exists
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }
    
    // Map image names
    const imageMap = {
      'Hero Image': 'cover.png',
      'Process Illustration': 'img_0.jpg',
      'Benefits Visualization': 'img_1.jpg',
      'Summary Graphic': 'img_2.jpg'
    };
    
    // Download each image
    for (const [key, data] of articleImages) {
      const filename = imageMap[data.name];
      if (!filename) continue;
      
      const filepath = path.join(IMAGE_DIR, filename);
      console.log(`\nDownloading ${data.name} as ${filename}...`);
      console.log(`URL: ${data.url.substring(0, 80)}...`);
      
      try {
        await downloadImage(data.url, filepath);
      } catch (error) {
        console.error(`❌ Failed to download ${filename}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Image fix completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixImages();