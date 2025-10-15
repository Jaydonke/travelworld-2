#!/usr/bin/env node

/**
 * 随机分配作者脚本 - 为所有文章随机分配不同的作者
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 获取所有可用的作者
 */
function getAvailableAuthors() {
  const authorsDir = path.join(__dirname, '../src/content/authors');
  const authors = [];
  
  try {
    const authorDirs = fs.readdirSync(authorsDir);
    
    for (const dir of authorDirs) {
      const authorPath = path.join(authorsDir, dir, 'index.mdx');
      if (fs.existsSync(authorPath)) {
        const content = fs.readFileSync(authorPath, 'utf8');
        const nameMatch = content.match(/name:\s*(.+)/);
        
        if (nameMatch) {
          authors.push({
            slug: dir,
            name: nameMatch[1].trim()
          });
        }
      }
    }
    
    return authors;
  } catch (error) {
    log(`❌ 读取作者目录失败: ${error.message}`, 'red');
    return [];
  }
}

/**
 * 获取所有文章
 */
function getAllArticles() {
  const articlesDir = path.join(__dirname, '../src/content/articles');
  const articles = [];
  
  try {
    const articleDirs = fs.readdirSync(articlesDir);
    
    for (const dir of articleDirs) {
      const articlePath = path.join(articlesDir, dir, 'index.mdx');
      if (fs.existsSync(articlePath)) {
        articles.push({
          slug: dir,
          path: articlePath
        });
      }
    }
    
    return articles;
  } catch (error) {
    log(`❌ 读取文章目录失败: ${error.message}`, 'red');
    return [];
  }
}

/**
 * 随机选择作者（避免连续重复）
 */
function getRandomAuthor(authors, lastAuthor = null, usedAuthors = []) {
  // 如果所有作者都用过了，重置使用记录
  if (usedAuthors.length >= authors.length) {
    usedAuthors = [];
  }
  
  // 过滤掉最近使用的作者和已使用的作者
  let availableAuthors = authors.filter(author => 
    author.slug !== lastAuthor && !usedAuthors.includes(author.slug)
  );
  
  // 如果没有可用作者，则只排除最近使用的
  if (availableAuthors.length === 0) {
    availableAuthors = authors.filter(author => author.slug !== lastAuthor);
  }
  
  // 如果还是没有，随机选择所有作者
  if (availableAuthors.length === 0) {
    availableAuthors = authors;
  }
  
  const randomIndex = Math.floor(Math.random() * availableAuthors.length);
  return availableAuthors[randomIndex];
}

/**
 * 更新文章的作者
 */
function updateArticleAuthor(articlePath, newAuthor) {
  try {
    const content = fs.readFileSync(articlePath, 'utf8');
    
    // 查找并替换作者信息
    const authorRegex = /authors:\s*\n\s*-\s*[^\n]+/;
    const newAuthorLine = `authors:\n  - ${newAuthor}`;
    
    let updatedContent;
    if (authorRegex.test(content)) {
      updatedContent = content.replace(authorRegex, newAuthorLine);
    } else {
      // 如果没有找到authors字段，在publishedTime之后添加
      const publishedTimeRegex = /(publishedTime:\s*[^\n]+\n)/;
      if (publishedTimeRegex.test(content)) {
        updatedContent = content.replace(publishedTimeRegex, `$1${newAuthorLine}\n`);
      } else {
        log(`⚠️  无法找到适合的位置插入作者信息: ${articlePath}`, 'yellow');
        return false;
      }
    }
    
    fs.writeFileSync(articlePath, updatedContent);
    return true;
  } catch (error) {
    log(`❌ 更新文章失败 ${articlePath}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 为所有文章随机分配作者
 */
function randomizeAllAuthors() {
  log('\n👥 开始为所有文章随机分配作者', 'bright');
  log('=' .repeat(60), 'blue');
  
  const authors = getAvailableAuthors();
  const articles = getAllArticles();
  
  if (authors.length === 0) {
    log('❌ 没有找到可用的作者', 'red');
    return;
  }
  
  if (articles.length === 0) {
    log('❌ 没有找到可用的文章', 'red');
    return;
  }
  
  log(`📊 统计信息:`, 'yellow');
  log(`   - 可用作者: ${authors.length} 位`, 'blue');
  log(`   - 待处理文章: ${articles.length} 篇`, 'blue');
  
  // 显示所有作者
  log(`\n👤 可用作者列表:`, 'cyan');
  authors.forEach(author => {
    log(`   - ${author.name} (${author.slug})`, 'magenta');
  });
  
  // 随机分配作者
  let lastAuthor = null;
  let usedAuthors = [];
  let successCount = 0;
  let failCount = 0;
  
  log(`\n🎲 开始随机分配:`, 'cyan');
  
  for (const article of articles) {
    const selectedAuthor = getRandomAuthor(authors, lastAuthor, usedAuthors);
    
    const success = updateArticleAuthor(article.path, selectedAuthor.slug);
    
    if (success) {
      log(`   ✅ ${article.slug} → ${selectedAuthor.name}`, 'green');
      successCount++;
      lastAuthor = selectedAuthor.slug;
      usedAuthors.push(selectedAuthor.slug);
      
      // 每3个作者重置一次，增加随机性
      if (usedAuthors.length >= Math.min(3, authors.length)) {
        usedAuthors = [];
      }
    } else {
      log(`   ❌ ${article.slug} → 失败`, 'red');
      failCount++;
    }
  }
  
  log(`\n📈 分配结果:`, 'yellow');
  log(`   - 成功: ${successCount} 篇`, 'green');
  log(`   - 失败: ${failCount} 篇`, 'red');
  log(`   - 总计: ${articles.length} 篇`, 'blue');
  
  if (successCount > 0) {
    log(`\n🎉 作者随机分配完成！`, 'green');
  }
}

/**
 * 分析当前作者分布
 */
function analyzeAuthorDistribution() {
  log('\n📊 分析当前作者分布', 'bright');
  log('=' .repeat(60), 'blue');
  
  const articles = getAllArticles();
  const authors = getAvailableAuthors();
  const authorStats = {};
  
  // 初始化统计
  authors.forEach(author => {
    authorStats[author.slug] = {
      name: author.name,
      count: 0,
      articles: []
    };
  });
  
  // 统计每个作者的文章数
  articles.forEach(article => {
    try {
      const content = fs.readFileSync(article.path, 'utf8');
      const authorMatch = content.match(/authors:\s*\n\s*-\s*([^\n]+)/);
      
      if (authorMatch) {
        const authorSlug = authorMatch[1].trim();
        if (authorStats[authorSlug]) {
          authorStats[authorSlug].count++;
          authorStats[authorSlug].articles.push(article.slug);
        }
      }
    } catch (error) {
      log(`⚠️  无法读取文章: ${article.slug}`, 'yellow');
    }
  });
  
  // 显示统计结果
  log(`📈 作者分布统计:`, 'cyan');
  
  const sortedStats = Object.entries(authorStats)
    .sort(([,a], [,b]) => b.count - a.count);
    
  sortedStats.forEach(([slug, stats]) => {
    if (stats.count > 0) {
      log(`   ${stats.name}: ${stats.count} 篇文章`, 'blue');
      if (stats.count <= 3) {
        log(`     → ${stats.articles.join(', ')}`, 'magenta');
      }
    }
  });
  
  // 显示没有文章的作者
  const unusedAuthors = sortedStats.filter(([,stats]) => stats.count === 0);
  if (unusedAuthors.length > 0) {
    log(`\n⚠️  未分配文章的作者:`, 'yellow');
    unusedAuthors.forEach(([slug, stats]) => {
      log(`   - ${stats.name}`, 'yellow');
    });
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'randomize':
      randomizeAllAuthors();
      break;
      
    case 'analyze':
      analyzeAuthorDistribution();
      break;
      
    default:
      log('\n👥 作者随机分配工具', 'bright');
      log('=' .repeat(40), 'blue');
      log('使用方法:', 'yellow');
      log('  node scripts/randomize-authors.js <command>', 'cyan');
      log('\n命令:', 'yellow');
      log('  randomize            - 为所有文章随机分配作者', 'blue');
      log('  analyze              - 分析当前作者分布情况', 'blue');
      log('\n示例:', 'yellow');
      log('  node scripts/randomize-authors.js analyze', 'cyan');
      log('  node scripts/randomize-authors.js randomize', 'cyan');
      break;
  }
}

main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});