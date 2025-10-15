#!/usr/bin/env node

/**
 * 修复文章标题设置
 * 确保至少有一篇主标题和4篇副标题
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

/**
 * 读取文章的frontmatter
 */
function readArticleFrontmatter(mdxPath) {
  const content = fs.readFileSync(mdxPath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) return null;
  
  const frontmatter = {};
  const lines = frontmatterMatch[1].split('\n');
  
  lines.forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      
      // 处理布尔值
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      // 处理日期
      else if (key === 'publishedTime') {
        value = new Date(value);
      }
      
      frontmatter[key] = value;
    }
  });
  
  return frontmatter;
}

/**
 * 更新文章的标题设置
 */
function updateArticleHeadlines(mdxPath, isMainHeadline, isSubHeadline) {
  let content = fs.readFileSync(mdxPath, 'utf8');
  
  // 更新 isMainHeadline
  content = content.replace(
    /^isMainHeadline:\s*.*$/m,
    `isMainHeadline: ${isMainHeadline}`
  );
  
  // 更新 isSubHeadline
  content = content.replace(
    /^isSubHeadline:\s*.*$/m,
    `isSubHeadline: ${isSubHeadline}`
  );
  
  fs.writeFileSync(mdxPath, content);
}

/**
 * 主函数
 */
function main() {
  log('\n🔧 修复文章标题设置脚本', 'bright');
  log('=' .repeat(60), 'blue');
  
  if (!fs.existsSync(ARTICLES_DIR)) {
    log('❌ 文章目录不存在', 'red');
    return;
  }
  
  // 读取所有文章
  const articles = [];
  const articleDirs = fs.readdirSync(ARTICLES_DIR);
  
  for (const dir of articleDirs) {
    const dirPath = path.join(ARTICLES_DIR, dir);
    const mdxFile = path.join(dirPath, 'index.mdx');
    
    if (fs.existsSync(mdxFile) && fs.statSync(dirPath).isDirectory()) {
      const frontmatter = readArticleFrontmatter(mdxFile);
      if (frontmatter) {
        articles.push({
          dir,
          path: mdxFile,
          title: frontmatter.title,
          publishedTime: frontmatter.publishedTime,
          isMainHeadline: frontmatter.isMainHeadline,
          isSubHeadline: frontmatter.isSubHeadline
        });
      }
    }
  }
  
  // 按发布时间排序（最新的在前）
  articles.sort((a, b) => b.publishedTime - a.publishedTime);
  
  log(`\n📊 找到 ${articles.length} 篇文章`, 'cyan');
  
  // 统计当前状态
  const currentMain = articles.filter(a => a.isMainHeadline === true).length;
  const currentSub = articles.filter(a => a.isSubHeadline === true).length;
  
  log(`\n📈 当前状态:`, 'yellow');
  log(`   主标题文章: ${currentMain} 篇`, 'blue');
  log(`   副标题文章: ${currentSub} 篇`, 'blue');
  
  // 修复标题设置
  let fixedCount = 0;
  
  // 设置第一篇为主标题
  if (articles.length > 0 && !articles[0].isMainHeadline) {
    updateArticleHeadlines(articles[0].path, true, false);
    log(`\n✅ 设置主标题: ${articles[0].title}`, 'green');
    fixedCount++;
  }
  
  // 设置第2-5篇为副标题
  for (let i = 1; i < Math.min(5, articles.length); i++) {
    if (!articles[i].isSubHeadline) {
      updateArticleHeadlines(articles[i].path, false, true);
      log(`✅ 设置副标题 ${i}: ${articles[i].title}`, 'green');
      fixedCount++;
    }
  }
  
  // 确保其他文章都不是主标题或副标题
  for (let i = 5; i < articles.length; i++) {
    if (articles[i].isMainHeadline || articles[i].isSubHeadline) {
      updateArticleHeadlines(articles[i].path, false, false);
      log(`⚠️  移除标题设置: ${articles[i].title}`, 'yellow');
      fixedCount++;
    }
  }
  
  if (fixedCount > 0) {
    log(`\n🎉 修复完成！已更新 ${fixedCount} 篇文章`, 'green');
    log('\n💡 建议:', 'cyan');
    log('   • 运行 npm run dev 查看效果', 'cyan');
    log('   • 确保之后运行脚本时文章能正确设置标题', 'cyan');
  } else {
    log('\n✅ 所有文章标题设置已正确，无需修复', 'green');
  }
  
  // 显示最终状态
  const finalMain = fixedCount > 0 ? 1 : currentMain;
  const finalSub = fixedCount > 0 ? Math.min(4, articles.length - 1) : currentSub;
  
  log(`\n📊 最终状态:`, 'bright');
  log(`   主标题文章: ${finalMain} 篇`, 'green');
  log(`   副标题文章: ${finalSub} 篇`, 'green');
  log(`   普通文章: ${articles.length - finalMain - finalSub} 篇`, 'blue');
}

// 运行脚本
main();