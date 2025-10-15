#!/usr/bin/env node

/**
 * 修复缺失的封面图片脚本
 * 为没有封面图片的文章创建占位符或使用第一张图片作为封面
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles')
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixMissingCovers() {
  log('\n🔧 修复缺失封面图片脚本启动', 'bright');
  log('=' .repeat(60), 'blue');
  
  const articleDirs = fs.readdirSync(CONFIG.articlesDir)
    .filter(dir => fs.statSync(path.join(CONFIG.articlesDir, dir)).isDirectory());
  
  log(`📋 找到 ${articleDirs.length} 个文章目录\n`, 'blue');
  
  let fixedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const slug of articleDirs) {
    const articleImagesDir = path.join(CONFIG.imagesDir, slug);
    const coverPath = path.join(articleImagesDir, 'cover.png');
    
    log(`📄 检查文章: ${slug}`, 'cyan');
    
    // 检查封面是否存在
    if (fs.existsSync(coverPath)) {
      log(`  ✅ 封面已存在`, 'green');
      skippedCount++;
      continue;
    }
    
    // 检查图片目录是否存在
    if (!fs.existsSync(articleImagesDir)) {
      fs.mkdirSync(articleImagesDir, { recursive: true });
      log(`  📁 创建图片目录`, 'blue');
    }
    
    let coverCreated = false;
    
    // 尝试找到第一张图片作为封面
    if (fs.existsSync(articleImagesDir)) {
      const imageFiles = fs.readdirSync(articleImagesDir)
        .filter(file => 
          file.endsWith('.jpg') || 
          file.endsWith('.jpeg') || 
          file.endsWith('.png')
        )
        .filter(file => file !== 'cover.png');
      
      if (imageFiles.length > 0) {
        const firstImage = imageFiles[0];
        const firstImagePath = path.join(articleImagesDir, firstImage);
        
        try {
          fs.copyFileSync(firstImagePath, coverPath);
          log(`  📸 使用 ${firstImage} 作为封面`, 'green');
          coverCreated = true;
        } catch (error) {
          log(`  ⚠️  复制图片失败: ${error.message}`, 'yellow');
        }
      }
    }
    
    // 如果没有图片，创建占位符
    if (!coverCreated) {
      try {
        // 创建1x1像素透明PNG占位符
        const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');
        fs.writeFileSync(coverPath, placeholderBuffer);
        log(`  📄 创建占位符封面`, 'yellow');
        coverCreated = true;
      } catch (error) {
        log(`  ❌ 创建占位符失败: ${error.message}`, 'red');
        errorCount++;
        continue;
      }
    }
    
    if (coverCreated) {
      fixedCount++;
    }
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log('📊 修复结果统计:', 'bright');
  log(`   ✅ 成功修复: ${fixedCount} 个`, 'green');
  log(`   ⏭️  已有封面: ${skippedCount} 个`, 'yellow');
  log(`   ❌ 修复失败: ${errorCount} 个`, 'red');
  
  if (fixedCount > 0) {
    log('\n🎉 封面图片修复完成！', 'green');
    log('💡 现在所有文章都有封面图片了', 'cyan');
  }
}

// 运行脚本
fixMissingCovers().catch(error => {
  log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});