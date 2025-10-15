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
  const categoryCount = {};
  const validCategories = ['movies', 'music', 'tv-shows', 'celebrities', 'pop-culture', 'reviews', 'news', 'events'];

  // Count articles per category
  articles.forEach(article => {
    categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
  });

  console.log('📊 文章分类质量分析');
  console.log('='.repeat(50));

  console.log('\n✅ 配置中的有效分类:');
  console.log(validCategories.join(', '));

  console.log('\n📈 每个分类的文章数量:');
  validCategories.forEach(cat => {
    const count = categoryCount[cat] || 0;
    const bar = '█'.repeat(count);
    console.log(`  ${cat.padEnd(15)} : ${count.toString().padStart(2)} ${bar}`);
  });

  console.log('\n📝 文章质量检查:');
  let issues = 0;

  articles.forEach((article, index) => {
    // Check if category is valid
    if (!validCategories.includes(article.category)) {
      console.log(`  ❌ 文章 ${index + 1}: 无效分类 "${article.category}"`);
      issues++;
    }

    // Check keywords
    if (!article.keywords || article.keywords.length !== 4) {
      console.log(`  ⚠️  文章 ${index + 1}: 关键词数量不是4个`);
      issues++;
    }

    // Check for year numbers
    if (article.topic.match(/202[0-9]/)) {
      console.log(`  ⚠️  文章 ${index + 1}: 标题包含年份`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log('  ✅ 所有文章都通过质量检查！');
  }

  console.log('\n📊 总结:');
  console.log(`  • 总文章数: ${articles.length}`);
  console.log(`  • 使用的分类数: ${Object.keys(categoryCount).length}/8`);
  console.log(`  • 平均每个分类: ${(articles.length / Object.keys(categoryCount).length).toFixed(1)} 篇文章`);

  // Check content diversity
  console.log('\n🎯 内容类型分析:');
  const contentTypes = {
    'Reviews': articles.filter(a => a.topic.toLowerCase().includes('review')).length,
    'Lists/Top': articles.filter(a => a.topic.match(/top \d+|best|must-/i)).length,
    'Guides': articles.filter(a => a.topic.toLowerCase().includes('guide')).length,
    'Trends': articles.filter(a => a.topic.toLowerCase().includes('trend')).length,
    'News': articles.filter(a => a.topic.toLowerCase().includes('news')).length,
    'Events': articles.filter(a => a.topic.toLowerCase().includes('event')).length,
  };

  Object.entries(contentTypes).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count} 篇`);
    }
  });
}