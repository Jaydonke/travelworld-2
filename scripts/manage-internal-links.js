#!/usr/bin/env node

/**
 * 内链管理脚本 - 为新文章自动生成和管理内链
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDynamicKeywordMapping } from '../src/lib/utils/dynamic-internal-links.js';

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
 * 分析当前内链状况
 */
function analyzeCurrentLinks() {
  log('\n🔍 分析当前内链状况', 'bright');
  log('=' .repeat(60), 'blue');
  
  const dynamicMapping = generateDynamicKeywordMapping();
  const totalKeywords = Object.keys(dynamicMapping).length;
  
  log(`📊 统计信息:`, 'yellow');
  log(`   - 动态生成关键词: ${totalKeywords}`, 'blue');
  
  // 按文章分组统计
  const articleStats = {};
  Object.entries(dynamicMapping).forEach(([keyword, slug]) => {
    if (!articleStats[slug]) {
      articleStats[slug] = [];
    }
    articleStats[slug].push(keyword);
  });
  
  log(`\n📋 按文章分组的关键词:`, 'cyan');
  Object.entries(articleStats)
    .sort(([,a], [,b]) => b.length - a.length)
    .slice(0, 10)
    .forEach(([slug, keywords]) => {
      log(`   ${slug}: ${keywords.length} 个关键词`, 'blue');
      if (keywords.length <= 5) {
        log(`     → ${keywords.join(', ')}`, 'magenta');
      } else {
        log(`     → ${keywords.slice(0, 3).join(', ')}... (+${keywords.length - 3} more)`, 'magenta');
      }
    });
  
  return { dynamicMapping, articleStats };
}

/**
 * 检查新文章的内链机会
 */
function checkNewArticleLinks(articleSlug) {
  log(`\n🔎 检查文章 "${articleSlug}" 的内链机会`, 'bright');
  log('=' .repeat(60), 'blue');
  
  const articlesDir = path.join(__dirname, '../src/content/articles');
  const articlePath = path.join(articlesDir, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    log(`❌ 文章不存在: ${articlePath}`, 'red');
    return;
  }
  
  const content = fs.readFileSync(articlePath, 'utf8');
  const dynamicMapping = generateDynamicKeywordMapping();
  
  // 查找文章中可能的内链
  const foundLinks = [];
  Object.entries(dynamicMapping).forEach(([keyword, targetSlug]) => {
    if (targetSlug !== articleSlug) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(content)) {
        foundLinks.push({ keyword, targetSlug });
      }
    }
  });
  
  log(`🎯 找到 ${foundLinks.length} 个潜在内链:`, 'green');
  foundLinks.forEach(link => {
    log(`   "${link.keyword}" → ${link.targetSlug}`, 'blue');
  });
  
  if (foundLinks.length === 0) {
    log('   暂无匹配的内链关键词', 'yellow');
  }
  
  return foundLinks;
}

/**
 * 生成内链报告
 */
function generateLinkReport() {
  log('\n📊 生成内链报告', 'bright');
  log('=' .repeat(60), 'blue');
  
  const { dynamicMapping, articleStats } = analyzeCurrentLinks();
  
  // 生成报告文件
  const reportPath = path.join(__dirname, '../internal-links-report.md');
  const reportContent = `# 内链系统报告

生成时间: ${new Date().toLocaleString()}

## 概览

- **总关键词数**: ${Object.keys(dynamicMapping).length}
- **文章数**: ${Object.keys(articleStats).length}
- **平均每篇文章关键词**: ${(Object.keys(dynamicMapping).length / Object.keys(articleStats).length).toFixed(1)}

## 文章关键词分布

${Object.entries(articleStats)
  .sort(([,a], [,b]) => b.length - a.length)
  .map(([slug, keywords]) => `### ${slug}
- **关键词数**: ${keywords.length}
- **关键词**: ${keywords.join(', ')}
`).join('\n')}

## 所有关键词映射

${Object.entries(dynamicMapping)
  .sort(([a], [b]) => b.length - a.length)
  .map(([keyword, slug]) => `- **"${keyword}"** → \`${slug}\``)
  .join('\n')}

---
*此报告由内链管理脚本自动生成*
`;
  
  fs.writeFileSync(reportPath, reportContent);
  log(`✅ 报告已生成: ${reportPath}`, 'green');
}

/**
 * 为新文章添加推荐关键词
 */
function suggestKeywordsForNewArticle(articleSlug) {
  log(`\n💡 为文章 "${articleSlug}" 推荐关键词`, 'bright');
  log('=' .repeat(60), 'blue');
  
  const articlesDir = path.join(__dirname, '../src/content/articles');
  const articlePath = path.join(articlesDir, articleSlug, 'index.mdx');
  
  if (!fs.existsSync(articlePath)) {
    log(`❌ 文章不存在: ${articlePath}`, 'red');
    return;
  }
  
  const content = fs.readFileSync(articlePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    log(`❌ 无法解析文章frontmatter`, 'red');
    return;
  }
  
  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*["']([^"']+)["']/);
  const categoryMatch = frontmatter.match(/category:\s*([^\n]+)/);
  
  if (!titleMatch) {
    log(`❌ 无法获取文章标题`, 'red');
    return;
  }
  
  const title = titleMatch[1];
  const category = categoryMatch ? categoryMatch[1].trim() : null;
  
  // 基于标题和类别推荐关键词
  const suggestions = [];
  const titleWords = title.toLowerCase().split(/[\s-]+/);
  
  // 基于标题的建议
  if (titleWords.includes('wellness') || titleWords.includes('spa')) {
    suggestions.push('wellness retreats', 'spa getaways', 'health tourism');
  }
  
  if (titleWords.includes('adventure') || titleWords.includes('exciting')) {
    suggestions.push('adventure travel', 'outdoor adventures', 'thrill seeking');
  }
  
  if (titleWords.includes('budget') || titleWords.includes('affordable')) {
    suggestions.push('budget travel', 'affordable trips', 'money-saving tips');
  }
  
  // 基于类别的建议
  const categoryKeywords = {
    'wellness-escapes': ['wellness tourism', 'health retreats', 'mindful travel'],
    'adventure-nature': ['adventure tourism', 'nature expeditions', 'wildlife encounters'],
    'cultural-immersion': ['cultural tourism', 'heritage travel', 'local experiences'],
    'budget-family': ['family travel', 'budget vacations', 'kid-friendly trips'],
    'mindful-travel': ['slow travel', 'sustainable tourism', 'conscious travel'],
    'hidden-gems': ['off-the-beaten-path', 'secret destinations', 'undiscovered places']
  };
  
  if (category && categoryKeywords[category]) {
    suggestions.push(...categoryKeywords[category]);
  }
  
  // 通用旅行关键词
  suggestions.push('travel tips', 'destination guide', 'travel planning');
  
  log(`🎯 推荐关键词 (基于标题: "${title}", 类别: ${category || 'unknown'}):`, 'green');
  suggestions.forEach(keyword => {
    log(`   - ${keyword}`, 'blue');
  });
  
  return suggestions;
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const articleSlug = args[1];
  
  switch (command) {
    case 'analyze':
      analyzeCurrentLinks();
      break;
      
    case 'check':
      if (!articleSlug) {
        log('❌ 请提供文章slug: npm run manage-links check <article-slug>', 'red');
        process.exit(1);
      }
      checkNewArticleLinks(articleSlug);
      break;
      
    case 'report':
      generateLinkReport();
      break;
      
    case 'suggest':
      if (!articleSlug) {
        log('❌ 请提供文章slug: npm run manage-links suggest <article-slug>', 'red');
        process.exit(1);
      }
      suggestKeywordsForNewArticle(articleSlug);
      break;
      
    default:
      log('\n🔗 内链管理工具', 'bright');
      log('=' .repeat(40), 'blue');
      log('使用方法:', 'yellow');
      log('  node scripts/manage-internal-links.js <command> [options]', 'cyan');
      log('\n命令:', 'yellow');
      log('  analyze              - 分析当前内链状况', 'blue');
      log('  check <slug>         - 检查特定文章的内链机会', 'blue');
      log('  report               - 生成详细的内链报告', 'blue');
      log('  suggest <slug>       - 为新文章推荐关键词', 'blue');
      log('\n示例:', 'yellow');
      log('  node scripts/manage-internal-links.js analyze', 'cyan');
      log('  node scripts/manage-internal-links.js check my-new-article', 'cyan');
      log('  node scripts/manage-internal-links.js suggest travel-guide', 'cyan');
      break;
  }
}

main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});