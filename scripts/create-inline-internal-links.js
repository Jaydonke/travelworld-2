#!/usr/bin/env node

/**
 * 创建正文内联内链脚本
 * 
 * 功能：
 * 1. 清理之前错误的"相关阅读"块
 * 2. 在正文中智能识别关键词
 * 3. 将关键词转换为指向相关文章的内链
 * 4. 使用正确的相对路径格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  maxLinksPerArticle: 3,
  minWordLength: 4,
  
  // 常用关键词及其权重
  keywordWeights: {
    // AI相关
    'ai': 10, 'artificial intelligence': 15, 'machine learning': 12, 'automation': 10,
    'prompt': 8, 'chatbot': 8, 'neural network': 10, 'deep learning': 12,
    
    // 业务相关  
    'business': 6, 'startup': 7, 'entrepreneur': 8, 'marketing': 7, 'sales': 6,
    'revenue': 7, 'profit': 6, 'growth': 6, 'strategy': 7,
    
    // 生产力相关
    'productivity': 8, 'efficiency': 7, 'workflow': 9, 'optimization': 8,
    'automation': 10, 'tools': 5, 'management': 6,
    
    // 技术相关
    'technology': 6, 'software': 6, 'development': 7, 'programming': 7,
    'coding': 6, 'web': 5, 'app': 5, 'digital': 5,
    
    // 内容相关
    'content': 6, 'writing': 6, 'blog': 5, 'social media': 7,
    'copywriting': 7, 'seo': 8, 'marketing': 7
  }
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
 * 获取所有文章元数据
 */
async function getAllArticleMetadata() {
  const articles = [];
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    return articles;
  }

  const articleDirs = fs.readdirSync(CONFIG.articlesDir)
    .filter(item => {
      const fullPath = path.join(CONFIG.articlesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });

  for (const articleDir of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
    
    if (fs.existsSync(articlePath)) {
      try {
        const content = fs.readFileSync(articlePath, 'utf8');
        const metadata = extractArticleMetadata(content, articleDir);
        articles.push(metadata);
      } catch (error) {
        log(`⚠️  无法读取文章: ${articleDir}`, 'yellow');
      }
    }
  }

  return articles;
}

/**
 * 提取文章元数据
 */
function extractArticleMetadata(content, slug) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const metadata = { slug };
  
  if (frontmatterMatch) {
    const frontmatterText = frontmatterMatch[1];
    
    // 提取标题
    const titleMatch = frontmatterText.match(/title:\s*["']([^"']+)["']/);
    metadata.title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
    
    // 提取描述
    const descMatch = frontmatterText.match(/description:\s*["']([^"']+)["']/);
    metadata.description = descMatch ? descMatch[1] : '';
    
    // 提取分类
    const categoryMatch = frontmatterText.match(/category:\s*(\w+)/);
    metadata.category = categoryMatch ? categoryMatch[1] : 'general';
  }

  // 提取正文内容（去除frontmatter和imports）
  let contentText = content.replace(/^---\s*\n[\s\S]*?\n---/, '');
  contentText = contentText.replace(/^import.*$/gm, '');
  
  // 移除markdown语法和HTML标签，获取纯文本
  const plainText = contentText
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除现有链接
    .replace(/[#*`]/g, '') // 移除markdown语法
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/💡\s*\*\*相关阅读\*\*:.*$/gm, '') // 移除旧的相关阅读块
    .toLowerCase();

  // 提取关键词并计算频率
  const keywords = extractKeywordsFromText(plainText, metadata.title);
  
  return {
    ...metadata,
    content: contentText, // 保留原始内容用于修改
    plainText,
    keywords
  };
}

/**
 * 从文本中提取关键词
 */
function extractKeywordsFromText(text, title = '') {
  const foundKeywords = [];
  const titleLower = title.toLowerCase();

  Object.entries(CONFIG.keywordWeights).forEach(([keyword, baseWeight]) => {
    // 计算关键词在文本中的出现次数
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const matches = text.match(regex);
    const frequency = matches ? matches.length : 0;
    
    if (frequency > 0) {
      // 如果关键词也在标题中，增加权重
      const titleBonus = titleLower.includes(keyword) ? baseWeight * 0.5 : 0;
      const totalWeight = (baseWeight + titleBonus) * frequency;
      
      foundKeywords.push({
        keyword,
        frequency,
        weight: totalWeight,
        inTitle: titleLower.includes(keyword)
      });
    }
  });

  // 按权重排序并返回前20个
  return foundKeywords
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20);
}

/**
 * 计算文章相似度（基于关键词匹配）
 */
function calculateArticleSimilarity(sourceArticle, targetArticle) {
  if (sourceArticle.slug === targetArticle.slug) return 0;

  const sourceKeywords = sourceArticle.keywords.map(k => k.keyword);
  const targetKeywords = targetArticle.keywords.map(k => k.keyword);
  
  const commonKeywords = sourceKeywords.filter(k => targetKeywords.includes(k));
  const totalKeywords = Math.max(sourceKeywords.length, targetKeywords.length, 1);
  
  let similarity = commonKeywords.length / totalKeywords;
  
  // 同分类加成
  if (sourceArticle.category === targetArticle.category) {
    similarity += 0.2;
  }

  return Math.min(similarity, 1.0);
}

/**
 * 为文章选择最佳内链目标
 */
function selectBestLinkTargets(sourceArticle, allArticles) {
  const candidates = allArticles
    .filter(article => article.slug !== sourceArticle.slug)
    .map(article => ({
      ...article,
      similarity: calculateArticleSimilarity(sourceArticle, article)
    }))
    .filter(article => article.similarity > 0.3) // 相似度阈值
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, CONFIG.maxLinksPerArticle);

  return candidates;
}

/**
 * 在文章中创建inline内链
 */
function createInlineLinks(sourceArticle, linkTargets) {
  if (linkTargets.length === 0) return sourceArticle.content;

  let content = sourceArticle.content;
  const addedLinks = new Set(); // 避免重复链接

  // 清理旧的相关阅读块
  content = content.replace(/💡\s*\*\*相关阅读\*\*:.*$/gm, '');
  content = content.replace(/^\n\n\n+/gm, '\n\n'); // 清理多余空行

  // 为每个目标文章寻找合适的关键词来创建内链
  linkTargets.forEach(target => {
    if (addedLinks.size >= CONFIG.maxLinksPerArticle) return;

    // 寻找在源文章中出现的、与目标文章相关的关键词
    const commonKeywords = target.keywords
      .filter(k => sourceArticle.keywords.find(sk => sk.keyword === k.keyword))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);

    for (const keywordInfo of commonKeywords) {
      const keyword = keywordInfo.keyword;
      
      // 避免重复链接同一个关键词
      if (addedLinks.has(keyword)) continue;

      // 创建正则表达式来匹配关键词（确保是完整单词）
      const regex = new RegExp(`\\b(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
      
      // 查找第一次出现的位置（避免在frontmatter、imports或已有链接中替换）
      const lines = content.split('\n');
      let replaced = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过frontmatter、imports和已有链接
        if (line.startsWith('---') || 
            line.startsWith('import ') || 
            line.includes('[') && line.includes('](')) {
          continue;
        }

        if (regex.test(line) && !replaced) {
          // 替换第一次出现的关键词为链接
          lines[i] = line.replace(regex, `[$1](/articles/${target.slug})`);
          addedLinks.add(keyword);
          replaced = true;
          log(`    🔗 添加内链: "${keyword}" → ${target.slug}`, 'blue');
          break;
        }
      }

      content = lines.join('\n');
      
      if (addedLinks.size >= CONFIG.maxLinksPerArticle) break;
    }
  });

  return content;
}

/**
 * 处理单篇文章
 */
async function processArticle(article, allArticles, dryRun = false) {
  const articlePath = path.join(CONFIG.articlesDir, article.slug, 'index.mdx');
  
  try {
    const originalContent = article.content;
    
    // 选择最佳链接目标
    const linkTargets = selectBestLinkTargets(article, allArticles);
    
    if (linkTargets.length === 0) {
      log(`  ➡️  ${article.slug}: 没有找到合适的关联文章`, 'cyan');
      return {
        slug: article.slug,
        title: article.title,
        processed: true,
        linksAdded: 0,
        changes: false,
        error: null
      };
    }

    // 创建内联链接
    const newContent = createInlineLinks(article, linkTargets);
    const hasChanges = originalContent !== newContent;

    const result = {
      slug: article.slug,
      title: article.title,
      processed: true,
      linksAdded: linkTargets.length,
      linkTargets: linkTargets.map(t => ({ slug: t.slug, title: t.title, similarity: t.similarity })),
      changes: hasChanges,
      error: null
    };

    // 如果不是预览模式且有变化，写入文件
    if (!dryRun && hasChanges) {
      // 创建备份
      const backupPath = articlePath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, originalContent);
      
      // 写入新内容
      fs.writeFileSync(articlePath, newContent);
      
      log(`  ✅ ${article.slug}: 添加了 ${linkTargets.length} 个内链`, 'green');
    } else if (dryRun) {
      log(`  👁️  ${article.slug}: 预计添加 ${linkTargets.length} 个内链`, 'blue');
      linkTargets.forEach(target => {
        log(`     → ${target.title} (相似度: ${(target.similarity * 100).toFixed(1)}%)`, 'cyan');
      });
    } else {
      log(`  ➡️  ${article.slug}: 无需更改`, 'cyan');
    }

    return result;

  } catch (error) {
    log(`  ❌ ${article.slug}: 处理失败 - ${error.message}`, 'red');
    return {
      slug: article.slug,
      title: article.title || article.slug,
      processed: false,
      linksAdded: 0,
      changes: false,
      error: error.message
    };
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🔗 创建正文内联内链脚本', 'bright');
  log('=' .repeat(60), 'blue');
  log('🎯 功能: 清理错误内链 | 创建inline内链 | 智能关键词匹配', 'cyan');
  log('=' .repeat(60), 'blue');

  try {
    // 获取所有文章元数据
    log('\n📚 分析文章内容...', 'cyan');
    const articles = await getAllArticleMetadata();
    
    if (articles.length === 0) {
      log('📭 没有找到任何文章', 'yellow');
      return;
    }

    log(`📋 找到 ${articles.length} 篇文章`, 'blue');

    // 询问是否预览模式
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const dryRun = await new Promise(resolve => {
      rl.question('\n🔍 是否先预览模式运行？(y/N): ', answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (dryRun) {
      log('\n👁️  预览模式: 分析内链但不修改文件', 'yellow');
    } else {
      log('\n🔧 正式模式: 将创建inline内链', 'green');
    }

    // 处理所有文章
    log('\n🔄 处理文章内链...', 'cyan');
    const results = [];
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      log(`\n📄 处理进度: ${i + 1}/${articles.length} - ${article.title}`, 'magenta');
      const result = await processArticle(article, articles, dryRun);
      results.push(result);
    }

    // 显示结果统计
    const successCount = results.filter(r => r.processed).length;
    const totalLinks = results.reduce((sum, r) => sum + r.linksAdded, 0);
    const changesCount = results.filter(r => r.changes).length;
    const errorCount = results.filter(r => r.error).length;

    log('\n' + '='.repeat(60), 'green');
    log('📊 内链创建完成', 'bright');
    log(`   📚 总文章数: ${articles.length}`, 'blue');
    log(`   ✅ 处理成功: ${successCount}`, 'green');
    log(`   🔗 总内链数: ${totalLinks}`, 'cyan');
    log(`   📝 有变化的文章: ${changesCount}`, 'yellow');
    log(`   ❌ 处理失败: ${errorCount}`, errorCount > 0 ? 'red' : 'green');

    if (errorCount > 0) {
      log('\n⚠️  处理失败的文章:', 'yellow');
      results.filter(r => r.error).forEach(result => {
        log(`   • ${result.slug}: ${result.error}`, 'red');
      });
    }

    // 显示链接最多的文章
    const topLinkedArticles = results
      .filter(r => r.linksAdded > 0)
      .sort((a, b) => b.linksAdded - a.linksAdded)
      .slice(0, 5);

    if (topLinkedArticles.length > 0) {
      log('\n🏆 内链最多的文章:', 'cyan');
      topLinkedArticles.forEach((article, index) => {
        log(`   ${index + 1}. ${article.title} (${article.linksAdded} 个链接)`, 'blue');
      });
    }

    if (!dryRun) {
      log('\n🎉 inline内链创建完成！', 'green');
      log('💡 建议:', 'cyan');
      log('   • 运行 npm run dev 查看效果', 'blue');
      log('   • 检查文章中的关键词链接', 'blue');
      log('   • 测试链接是否正确跳转', 'blue');
    } else {
      log('\n👀 预览完成！运行脚本时选择 N 来执行实际修改', 'yellow');
    }

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

export { main };