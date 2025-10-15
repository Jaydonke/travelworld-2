#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../src/assets/images/articles');

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Future articles that need images
const futureArticles = [
  'advanced-affiliate-tracking-tools-comparison',
  'email-automation-sequences-that-convert',
  'content-monetization-strategies-for-2025',
  'building-profitable-membership-sites',
  'instagram-content-strategy-for-bloggers',
  'voice-search-optimization-complete-guide',
  'influencer-collaboration-strategies',
  'wordpress-speed-optimization-advanced',
  'podcast-monetization-for-bloggers',
  'pinterest-traffic-generation-masterclass',
  'youtube-channel-blog-integration',
  'local-seo-for-blog-monetization',
  'webinar-funnel-optimization-guide',
  'tiktok-blog-promotion-strategies',
  'subscription-box-blog-business-model'
];

// Get a random existing cover image to copy
function getRandomExistingImage() {
  const existingArticleDirs = fs.readdirSync(imagesDir)
    .filter(dir => {
      const dirPath = path.join(imagesDir, dir);
      return fs.statSync(dirPath).isDirectory() && 
             !futureArticles.includes(dir) &&
             fs.existsSync(path.join(dirPath, 'cover.png'));
    });
  
  if (existingArticleDirs.length === 0) {
    return null;
  }
  
  const randomDir = existingArticleDirs[Math.floor(Math.random() * existingArticleDirs.length)];
  return path.join(imagesDir, randomDir, 'cover.png');
}

// Create images for future articles
function createFutureArticleImages() {
  log('🖼️  Creating Images for Future Articles', 'cyan');
  log('======================================\n', 'cyan');
  
  // Get a source image to copy
  const sourceImage = getRandomExistingImage();
  
  if (!sourceImage) {
    log('❌ No existing cover images found to use as template', 'red');
    return;
  }
  
  log(`📋 Using template: ${path.basename(path.dirname(sourceImage))}/cover.png\n`, 'blue');
  
  let created = 0;
  let skipped = 0;
  
  for (const articleSlug of futureArticles) {
    const articleImageDir = path.join(imagesDir, articleSlug);
    const coverPath = path.join(articleImageDir, 'cover.png');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(articleImageDir)) {
      fs.mkdirSync(articleImageDir, { recursive: true });
    }
    
    // Check if cover already exists
    if (fs.existsSync(coverPath)) {
      log(`⏭️  ${articleSlug}: Cover already exists`, 'yellow');
      skipped++;
      continue;
    }
    
    // Copy the source image
    try {
      fs.copyFileSync(sourceImage, coverPath);
      log(`✅ ${articleSlug}: Cover image created`, 'green');
      created++;
    } catch (error) {
      log(`❌ ${articleSlug}: Failed to create cover - ${error.message}`, 'red');
    }
  }
  
  // Summary
  log('\n📊 Summary:', 'cyan');
  log(`   Images created: ${created}`, 'green');
  log(`   Images skipped: ${skipped}`, 'yellow');
  log(`   Total articles: ${futureArticles.length}`, 'blue');
  
  if (created > 0) {
    log('\n✨ Future article images created successfully!', 'green');
    log('   You can now build the site without image errors.', 'blue');
  }
}

// Main execution
createFutureArticleImages();