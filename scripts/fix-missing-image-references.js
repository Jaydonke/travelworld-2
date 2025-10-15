#!/usr/bin/env node

/**
 * 修复缺失图片引用脚本
 * 移除MDX文件中指向不存在图片的引用
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

function log(message, color = 'cyan') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fixMissingImageReferences() {
  const articles = fs.readdirSync(CONFIG.articlesDir);
  let fixedCount = 0;
  
  log('🚀 开始修复缺失图片引用...', 'cyan');
  
  articles.forEach(articleSlug => {
    const articlePath = path.join(CONFIG.articlesDir, articleSlug);
    const indexPath = path.join(articlePath, 'index.mdx');
    const articleImagesDir = path.join(CONFIG.imagesDir, articleSlug);
    
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      const originalContent = content;
      
      // 查找所有图片引用
      const imageMatches = content.match(/!\[[^\]]*\]\(@assets\/images\/articles\/[^)]+\)/g);
      
      if (imageMatches) {
        imageMatches.forEach(imageRef => {
          // 提取图片路径
          const pathMatch = imageRef.match(/@assets\/images\/articles\/(.+)/);
          if (pathMatch) {
            const relativePath = pathMatch[1];
            const fullImagePath = path.join(CONFIG.imagesDir, relativePath);
            
            // 检查图片是否存在
            if (!fs.existsSync(fullImagePath)) {
              // 移除不存在的图片引用
              content = content.replace(imageRef, '');
              log(`  ⚠️  移除缺失图片: ${relativePath}`, 'yellow');
              fixedCount++;
            }
          }
        });
        
        // 清理多余的空行
        content = content.replace(/\n{3,}/g, '\n\n');
        
        // 如果内容有变化，写回文件
        if (content !== originalContent) {
          fs.writeFileSync(indexPath, content);
          log(`  ✅ 修复文章: ${articleSlug}`, 'green');
        }
      }
    }
  });
  
  log(`\n🎉 修复完成！共移除了 ${fixedCount} 个缺失图片引用`, 'green');
}

fixMissingImageReferences();