#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function findCorruptedImages() {
  const articlesDir = path.join(__dirname, '../src/assets/images/articles');
  const corrupted = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.jpg') || item.endsWith('.png'))) {
        // Check if file is suspiciously small (less than 100 bytes)
        if (stat.size < 100) {
          corrupted.push({
            path: fullPath,
            size: stat.size,
            name: item
          });
        }
      }
    }
  }

  scanDirectory(articlesDir);
  return corrupted;
}

async function fixCorruptedImage(imagePath) {
  const dir = path.dirname(imagePath);
  const filename = path.basename(imagePath);

  // Try to find a valid image in the same directory to use as replacement
  const files = fs.readdirSync(dir);
  let validImage = null;

  for (const file of files) {
    if (file === filename) continue; // Skip the corrupted file

    const filePath = path.join(dir, file);
    if ((file.endsWith('.jpg') || file.endsWith('.png')) && fs.statSync(filePath).size > 1000) {
      validImage = filePath;
      break;
    }
  }

  if (!validImage) {
    log(`  ❌ No valid image found in directory to use as replacement`, 'red');
    return false;
  }

  try {
    // Read the valid image
    const imageBuffer = await sharp(validImage)
      .resize(1200, 800, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    // Determine output format based on original filename
    if (filename.endsWith('.jpg')) {
      await sharp(imageBuffer)
        .jpeg({ quality: 85 })
        .toFile(imagePath);
    } else {
      await sharp(imageBuffer)
        .png({ compressionLevel: 8 })
        .toFile(imagePath);
    }

    log(`  ✅ Fixed using ${path.basename(validImage)} as source`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 Scanning for corrupted images...', 'cyan');

  const corruptedImages = await findCorruptedImages();

  if (corruptedImages.length === 0) {
    log('✅ No corrupted images found!', 'green');
    return;
  }

  log(`\n❌ Found ${corruptedImages.length} corrupted image(s):`, 'yellow');

  for (const img of corruptedImages) {
    const relativePath = path.relative(path.join(__dirname, '..'), img.path);
    log(`\n📁 ${relativePath} (${img.size} bytes)`, 'cyan');
    await fixCorruptedImage(img.path);
  }

  log('\n✨ Image repair process completed!', 'bright');

  // Verify the fixes
  log('\n🔍 Verifying fixes...', 'cyan');
  const stillCorrupted = await findCorruptedImages();

  if (stillCorrupted.length === 0) {
    log('✅ All images successfully repaired!', 'green');
  } else {
    log(`⚠️  ${stillCorrupted.length} image(s) could not be repaired`, 'yellow');
    for (const img of stillCorrupted) {
      const relativePath = path.relative(path.join(__dirname, '..'), img.path);
      log(`  - ${relativePath}`, 'red');
    }
  }
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});