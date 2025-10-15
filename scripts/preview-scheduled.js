#!/usr/bin/env node

/**
 * 预览定时发布文章脚本
 * 显示所有设置了未来发布时间的文章
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/blog')
};

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
 * 解析MDX文件的前置信息
 * @param {string} filePath - MDX文件路径
 * @returns {Object} 文章信息
 */
function parseMdxFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    const data = {};

    let currentKey = null;
    let inArray = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (inArray && !trimmed.startsWith('-') && !trimmed.startsWith(' ')) {
        inArray = false;
      }

      if (inArray) {
        if (trimmed.startsWith('-')) {
          const value = trimmed.substring(1).trim();
          if (Array.isArray(data[currentKey])) {
            data[currentKey].push(value);
          } else {
            data[currentKey] = [value];
          }
        }
      } else {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          let value = trimmed.substring(colonIndex + 1).trim();

          // 移除引号
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          if (!value) {
            // 可能是数组或多行值的开始
            inArray = true;
            currentKey = key;
            data[key] = [];
          } else {
            data[key] = value;
          }
        }
      }
    }

    return data;
  } catch (error) {
    log(`解析文件失败 ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

/**
 * 获取所有定时发布的文章
 * @returns {Array} 定时文章列表
 */
function getScheduledArticles() {
  const now = new Date();
  const articles = [];

  try {
    const articleDirs = fs.readdirSync(CONFIG.articlesDir);

    for (const dir of articleDirs) {
      const mdxPath = path.join(CONFIG.articlesDir, dir, 'index.mdx');
      
      if (fs.existsSync(mdxPath)) {
        const frontmatter = parseMdxFrontmatter(mdxPath);
        
        if (frontmatter && frontmatter.publishedTime) {
          const publishTime = new Date(frontmatter.publishedTime);
          const isDraft = frontmatter.isDraft === 'true' || frontmatter.isDraft === true;
          
          // 只显示未来发布时间的非草稿文章
          if (publishTime > now && !isDraft) {
            articles.push({
              slug: dir,
              title: frontmatter.title || dir,
              publishTime: publishTime,
              publishedTime: frontmatter.publishedTime,
              description: frontmatter.description || '',
              category: frontmatter.category || 'uncategorized',
              authors: Array.isArray(frontmatter.authors) ? frontmatter.authors : [frontmatter.authors || 'unknown'],
              isMainHeadline: frontmatter.isMainHeadline === 'true' || frontmatter.isMainHeadline === true,
              isSubHeadline: frontmatter.isSubHeadline === 'true' || frontmatter.isSubHeadline === true
            });
          }
        }
      }
    }

    // 按发布时间排序
    articles.sort((a, b) => a.publishTime.getTime() - b.publishTime.getTime());
    
    return articles;
  } catch (error) {
    log(`获取定时文章失败: ${error.message}`, 'red');
    return [];
  }
}

/**
 * 格式化时间显示
 * @param {Date} date - 时间对象
 * @returns {string} 格式化的时间字符串
 */
function formatTimeDisplay(date) {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  const diffHours = Math.ceil(diffMs / (60 * 60 * 1000));

  let relativeTime = '';
  if (diffDays === 1) {
    relativeTime = '明天';
  } else if (diffDays === 2) {
    relativeTime = '后天';
  } else if (diffDays > 0) {
    relativeTime = `${diffDays}天后`;
  } else if (diffHours > 0) {
    relativeTime = `${diffHours}小时后`;
  } else {
    relativeTime = '即将发布';
  }

  return `${date.toLocaleString('zh-CN')} (${relativeTime})`;
}

/**
 * 按日期分组显示文章
 * @param {Array} articles - 文章列表
 */
function displayArticlesByDate(articles) {
  if (articles.length === 0) {
    log('📝 当前没有定时发布的文章', 'yellow');
    return;
  }

  // 按日期分组
  const groupedByDate = {};
  articles.forEach(article => {
    const dateKey = article.publishTime.toDateString();
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(article);
  });

  log('📅 定时发布文章一览', 'bright');
  log('='.repeat(100), 'blue');

  Object.entries(groupedByDate).forEach(([dateKey, dayArticles]) => {
    const date = new Date(dateKey);
    const now = new Date();
    
    let dateLabel = date.toLocaleDateString('zh-CN');
    if (date.toDateString() === now.toDateString()) {
      dateLabel += ' (今天)';
    } else if (date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()) {
      dateLabel += ' (明天)';
    } else if (date.toDateString() === new Date(now.getTime() + 48 * 60 * 60 * 1000).toDateString()) {
      dateLabel += ' (后天)';
    }

    log(`\n📆 ${dateLabel} - ${dayArticles.length} 篇文章`, 'magenta');
    log('-'.repeat(80), 'cyan');

    dayArticles.forEach((article, index) => {
      const timeStr = article.publishTime.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      log(`${(index + 1).toString().padStart(2, ' ')}. ${article.title}`, 'cyan');
      log(`    🕐 ${timeStr}`, 'yellow');
      log(`    📂 ${article.category}`, 'blue');
      log(`    👤 ${article.authors.join(', ')}`, 'green');
      
      if (article.isMainHeadline) {
        log(`    ⭐ 主标题`, 'yellow');
      } else if (article.isSubHeadline) {
        log(`    🔸 副标题`, 'yellow');
      }
      
      if (article.description) {
        const shortDesc = article.description.length > 80 ? 
          article.description.substring(0, 77) + '...' : 
          article.description;
        log(`    📝 ${shortDesc}`, 'reset');
      }
      
      log(`    📁 src/content/blog/${article.slug}/`, 'blue');
    });
  });

  log('\n' + '='.repeat(100), 'blue');
}

/**
 * 显示统计信息
 * @param {Array} articles - 文章列表
 */
function displayStatistics(articles) {
  if (articles.length === 0) return;

  log('📊 统计信息:', 'bright');
  log('-'.repeat(50), 'yellow');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const thisWeek = articles.filter(a => a.publishTime <= nextWeek).length;
  const thisMonth = articles.filter(a => a.publishTime <= nextMonth).length;
  const mainHeadlines = articles.filter(a => a.isMainHeadline).length;
  const subHeadlines = articles.filter(a => a.isSubHeadline).length;

  log(`📈 总定时文章: ${articles.length} 篇`, 'green');
  log(`📅 本周将发布: ${thisWeek} 篇`, 'cyan');
  log(`📅 本月将发布: ${thisMonth} 篇`, 'cyan');
  log(`⭐ 主标题文章: ${mainHeadlines} 篇`, 'yellow');
  log(`🔸 副标题文章: ${subHeadlines} 篇`, 'yellow');

  // 按分类统计
  const categories = {};
  articles.forEach(article => {
    categories[article.category] = (categories[article.category] || 0) + 1;
  });

  if (Object.keys(categories).length > 0) {
    log('\n📂 分类分布:', 'bright');
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        log(`   ${category}: ${count} 篇`, 'blue');
      });
  }

  // 下一篇即将发布的文章
  if (articles.length > 0) {
    const nextArticle = articles[0];
    log(`\n🚀 下一篇发布: "${nextArticle.title}"`, 'bright');
    log(`   🕐 ${formatTimeDisplay(nextArticle.publishTime)}`, 'magenta');
  }

  log('-'.repeat(50), 'yellow');
}

/**
 * 主函数
 */
function main() {
  log('\n🔍 定时发布文章预览', 'bright');
  log('='.repeat(100), 'blue');

  const articles = getScheduledArticles();

  displayStatistics(articles);
  displayArticlesByDate(articles);

  if (articles.length > 0) {
    log('\n💡 提示:', 'bright');
    log('   • 这些文章已创建但设置了未来发布时间', 'cyan');
    log('   • 网站会自动隐藏未到发布时间的文章', 'cyan');
    log('   • 使用 npm run build 重新构建网站来激活到期的文章', 'cyan');
    log('   • 建议设置 GitHub Actions 每日自动构建', 'cyan');
  } else {
    log('\n💡 如需添加定时文章:', 'bright');
    log('   1. 将HTML文件放入 newarticle 目录', 'cyan');
    log('   2. 运行 npm run schedule-articles', 'cyan');
    log('   3. 文章将按配置的时间表自动发布', 'cyan');
  }

  log('\n='.repeat(100), 'blue');
}

// 运行脚本
main();