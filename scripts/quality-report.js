import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config.template.js
const configPath = path.join(__dirname, '..', 'config.template.js');
const configContent = fs.readFileSync(configPath, 'utf-8');

// Extract ARTICLE_GENERATION_CONFIG
const match = configContent.match(/export const ARTICLE_GENERATION_CONFIG = (\{[\s\S]*?\});/);
if (match) {
  const configStr = match[1];
  const config = eval('(' + configStr + ')');
  const articles = config.articles;

  console.log('\n' + '='.repeat(70));
  console.log('📊 文章生成质量报告 - QUALITY REPORT');
  console.log('='.repeat(70));

  // 1. Overall Statistics
  console.log('\n📈 总体统计:');
  console.log(`  ✅ 文章总数: ${articles.length}/25`);

  // Check for placeholders or generic titles
  const placeholders = articles.filter(a =>
    a.topic.includes('Article 25') ||
    a.topic.includes('Essential Guide to Pop Culture')
  );
  console.log(`  ✅ 占位符文章: ${placeholders.length} 个`);

  // 2. Category Distribution
  const categoryCount = {};
  articles.forEach(a => {
    categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
  });

  console.log('\n📂 分类分布 (目标: 每个分类3-4篇):');
  const categories = ['movies', 'music', 'tv-shows', 'celebrities', 'pop-culture', 'reviews', 'news', 'events'];
  let perfectDistribution = true;

  categories.forEach(cat => {
    const count = categoryCount[cat] || 0;
    const bar = '█'.repeat(count);
    const status = (count >= 2 && count <= 4) ? '✅' : '⚠️';
    if (count < 2 || count > 4) perfectDistribution = false;
    console.log(`  ${status} ${cat.padEnd(12)}: ${count} ${bar}`);
  });

  // 3. Content Type Analysis
  console.log('\n📝 内容类型多样性:');
  const contentTypes = {
    'Reviews (评论)': articles.filter(a => a.topic.toLowerCase().includes('review')).length,
    'Lists (列表)': articles.filter(a => a.topic.match(/top \d+|best/i)).length,
    'Guides (指南)': articles.filter(a => a.topic.toLowerCase().includes('guide')).length,
    'News (新闻)': articles.filter(a => a.topic.toLowerCase().includes('news')).length,
    'Analysis (分析)': articles.filter(a =>
      a.topic.toLowerCase().includes('evolution') ||
      a.topic.toLowerCase().includes('impact') ||
      a.topic.toLowerCase().includes('influence')
    ).length,
    'Events (活动)': articles.filter(a => a.topic.toLowerCase().includes('event')).length,
  };

  let goodDiversity = true;
  Object.entries(contentTypes).forEach(([type, count]) => {
    const status = count > 0 ? '✅' : '❌';
    if (count === 0) goodDiversity = false;
    console.log(`  ${status} ${type.padEnd(20)}: ${count} 篇`);
  });

  // 4. Keyword Quality
  console.log('\n🔍 关键词质量:');
  let keywordIssues = 0;
  let yearIssues = 0;
  let shortKeywords = 0;

  articles.forEach((article, index) => {
    article.keywords.forEach(keyword => {
      const wordCount = keyword.split(' ').length;
      if (wordCount < 2 || wordCount > 4) {
        shortKeywords++;
      }
      if (keyword.match(/202[0-9]/)) {
        yearIssues++;
      }
    });
  });

  const totalKeywords = articles.length * 4;
  console.log(`  • 总关键词数: ${totalKeywords}`);
  console.log(`  • 包含年份的关键词: ${yearIssues} 个 ${yearIssues === 0 ? '✅' : '⚠️'}`);
  console.log(`  • 词数不合规的关键词: ${shortKeywords} 个 ${shortKeywords === 0 ? '✅' : '⚠️'}`);

  // 5. Title Uniqueness
  console.log('\n🎯 标题独特性:');
  const titleWords = new Set();
  const titlePatterns = {
    'Top/Best': 0,
    'Guide': 0,
    'Review': 0,
    'News': 0,
    'Evolution/Influence': 0
  };

  articles.forEach(a => {
    const title = a.topic.toLowerCase();
    if (title.includes('top') || title.includes('best')) titlePatterns['Top/Best']++;
    if (title.includes('guide')) titlePatterns['Guide']++;
    if (title.includes('review')) titlePatterns['Review']++;
    if (title.includes('news')) titlePatterns['News']++;
    if (title.includes('evolution') || title.includes('influence')) titlePatterns['Evolution/Influence']++;

    title.split(' ').forEach(word => {
      if (word.length > 3) titleWords.add(word);
    });
  });

  console.log(`  • 独特词汇数: ${titleWords.size}`);
  console.log(`  • 标题模式分布:`);
  Object.entries(titlePatterns).forEach(([pattern, count]) => {
    if (count > 0) {
      console.log(`    - ${pattern}: ${count} 篇`);
    }
  });

  // 6. Quality Score
  console.log('\n⭐ 质量评分:');
  let score = 100;
  const deductions = [];

  if (placeholders.length > 0) {
    score -= placeholders.length * 5;
    deductions.push(`占位符文章 -${placeholders.length * 5}`);
  }
  if (!perfectDistribution) {
    score -= 5;
    deductions.push('分类分布不均 -5');
  }
  if (!goodDiversity) {
    score -= 10;
    deductions.push('内容类型不够多样 -10');
  }
  if (yearIssues > 0) {
    score -= Math.min(yearIssues * 2, 10);
    deductions.push(`包含年份 -${Math.min(yearIssues * 2, 10)}`);
  }
  if (shortKeywords > 0) {
    score -= Math.min(shortKeywords, 10);
    deductions.push(`关键词长度问题 -${Math.min(shortKeywords, 10)}`);
  }

  console.log(`  • 基础分: 100`);
  if (deductions.length > 0) {
    console.log(`  • 扣分项:`);
    deductions.forEach(d => console.log(`    - ${d}`));
  }
  console.log(`  • 最终得分: ${score}/100 ${score >= 90 ? '🏆 优秀' : score >= 80 ? '✅ 良好' : score >= 70 ? '⚠️ 一般' : '❌ 需改进'}`);

  // 7. Recommendations
  if (score < 100) {
    console.log('\n💡 改进建议:');
    if (placeholders.length > 0) {
      console.log('  • 移除占位符文章，确保AI生成完整的25篇');
    }
    if (yearIssues > 0) {
      console.log('  • 移除关键词中的具体年份，使用"latest", "current", "modern"等词');
    }
    if (!perfectDistribution) {
      console.log('  • 调整分类分布，确保每个分类有3-4篇文章');
    }
    if (!goodDiversity) {
      console.log('  • 增加内容类型多样性，包含更多指南、分析类文章');
    }
  }

  console.log('\n' + '='.repeat(70));
}