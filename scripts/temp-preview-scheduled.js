#!/usr/bin/env node

/**
 * 临时预览定时发布文章
 * 将所有未来发布时间改为过去时间以便预览
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function log(message, color = 'cyan') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function processArticles() {
  const articles = fs.readdirSync(articlesDir);
  let modifiedCount = 0;
  
  articles.forEach(articleSlug => {
    const articlePath = path.join(articlesDir, articleSlug);
    const indexPath = path.join(articlePath, 'index.mdx');
    
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf8');
      const originalContent = content;
      
      // 查找未来发布时间
      const publishTimeMatch = content.match(/publishedTime:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      
      if (publishTimeMatch) {
        const publishTime = new Date(publishTimeMatch[1]);
        const now = new Date();
        
        if (publishTime > now) {
          // 设置为昨天的时间
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(9, 0, 0, 0);
          
          const newTime = yesterday.toISOString();
          content = content.replace(publishTimeMatch[0], `publishedTime: ${newTime}`);
          
          fs.writeFileSync(indexPath, content);
          log(`✅ 修改文章时间: ${articleSlug}`, 'green');
          log(`   原时间: ${publishTimeMatch[1]}`, 'yellow');
          log(`   新时间: ${newTime}`, 'yellow');
          modifiedCount++;
        }
      }
    }
  });
  
  log(`\n🎉 完成！共修改了 ${modifiedCount} 篇文章的发布时间`, 'green');
  log('现在所有定时发布的文章都能在网站上看到了！', 'cyan');
  log('\n💡 预览完成后，运行以下命令恢复原始时间:', 'yellow');
  log('git checkout -- src/content/articles/*/index.mdx', 'yellow');
}

log('🚀 开始修改定时发布文章的时间...', 'cyan');
processArticles();