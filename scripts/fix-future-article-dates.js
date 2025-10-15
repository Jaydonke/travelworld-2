#!/usr/bin/env node

/**
 * 修复未来文章的发布时间，使其保持3天间隔
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 获取所有未来发布的文章
function getFutureArticles() {
  const now = new Date();
  const articles = [];
  
  const articleDirs = fs.readdirSync(ARTICLES_DIR).filter(f => 
    fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
  );
  
  for (const articleDir of articleDirs) {
    const mdxPath = path.join(ARTICLES_DIR, articleDir, 'index.mdx');
    if (!fs.existsSync(mdxPath)) continue;
    
    const content = fs.readFileSync(mdxPath, 'utf8');
    const timeMatch = content.match(/publishedTime:\s*(.+)/);
    if (!timeMatch) continue;
    
    const publishTime = new Date(timeMatch[1].trim());
    if (publishTime > now) {
      articles.push({
        slug: articleDir,
        path: mdxPath,
        publishTime: publishTime,
        content: content
      });
    }
  }
  
  // 按发布时间排序
  articles.sort((a, b) => a.publishTime - b.publishTime);
  return articles;
}

// 修复文章发布时间
function fixArticleDates() {
  log('\n🔧 修复未来文章发布时间（保持3天间隔）', 'cyan');
  log('='.repeat(60), 'blue');
  
  const futureArticles = getFutureArticles();
  
  if (futureArticles.length === 0) {
    log('✅ 没有找到未来发布的文章', 'green');
    return;
  }
  
  log(`\n📋 找到 ${futureArticles.length} 篇未来发布的文章`, 'blue');
  
  // 计算新的发布时间（从第一篇文章的时间开始，每篇间隔3天）
  const firstArticleTime = futureArticles[0].publishTime;
  const baseDate = new Date(firstArticleTime);
  
  log(`\n📅 基准时间: ${baseDate.toLocaleDateString('zh-CN')} ${baseDate.toLocaleTimeString('zh-CN')}`, 'yellow');
  log('📝 更新发布时间:', 'cyan');
  
  let updatedCount = 0;
  
  futureArticles.forEach((article, index) => {
    // 计算新的发布时间（每篇间隔3天）
    const newPublishTime = new Date(baseDate);
    newPublishTime.setDate(newPublishTime.getDate() + (index * 3));
    newPublishTime.setHours(9, 0, 0, 0); // 设置为早上9点
    
    // 检查是否需要更新
    const oldTimeStr = article.publishTime.toISOString();
    const newTimeStr = newPublishTime.toISOString();
    
    if (oldTimeStr !== newTimeStr) {
      // 创建备份
      const backupPath = `${article.path}.backup.${Date.now()}`;
      fs.copyFileSync(article.path, backupPath);
      
      // 更新内容
      const updatedContent = article.content.replace(
        /publishedTime:\s*.+/,
        `publishedTime: ${newTimeStr}`
      );
      
      // 写入文件
      fs.writeFileSync(article.path, updatedContent);
      
      log(`  ✅ ${article.slug}`, 'green');
      log(`     旧时间: ${article.publishTime.toLocaleDateString('zh-CN')}`, 'yellow');
      log(`     新时间: ${newPublishTime.toLocaleDateString('zh-CN')} (间隔${index * 3}天)`, 'cyan');
      
      updatedCount++;
    } else {
      log(`  ⏭️  ${article.slug} - 时间无需更新`, 'blue');
    }
  });
  
  log('\n' + '='.repeat(60), 'blue');
  log(`📊 统计:`, 'cyan');
  log(`  总文章数: ${futureArticles.length}`, 'blue');
  log(`  已更新: ${updatedCount}`, 'green');
  log(`  未更改: ${futureArticles.length - updatedCount}`, 'yellow');
  
  if (updatedCount > 0) {
    log('\n✨ 发布时间修复完成！', 'green');
    log('📅 所有未来文章现在保持3天间隔发布', 'cyan');
  } else {
    log('\n✅ 所有文章时间已经正确，无需修改', 'green');
  }
}

// 运行修复
fixArticleDates();