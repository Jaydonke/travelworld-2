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

  console.log('📝 文章内容质量详细分析');
  console.log('='.repeat(60));

  // Sample articles from each category
  const categories = ['movies', 'music', 'tv-shows', 'celebrities', 'pop-culture', 'reviews', 'news', 'events'];

  categories.forEach(cat => {
    const categoryArticles = articles.filter(a => a.category === cat);
    if (categoryArticles.length > 0) {
      console.log(`\n📂 ${cat.toUpperCase()} (${categoryArticles.length} 篇):`);
      categoryArticles.forEach(article => {
        console.log(`  • ${article.topic}`);
        console.log(`    关键词: ${article.keywords.join(' | ')}`);
      });
    }
  });

  // Check keyword quality
  console.log('\n🔍 关键词质量检查:');
  let keywordIssues = [];

  articles.forEach((article, index) => {
    article.keywords.forEach(keyword => {
      // Check word count
      const wordCount = keyword.split(' ').length;
      if (wordCount < 2 || wordCount > 4) {
        keywordIssues.push(`文章 ${index + 1}: "${keyword}" (${wordCount} 个单词)`);
      }
      // Check for years
      if (keyword.match(/202[0-9]/)) {
        keywordIssues.push(`文章 ${index + 1}: "${keyword}" 包含年份`);
      }
    });
  });

  if (keywordIssues.length === 0) {
    console.log('  ✅ 所有关键词都符合2-4个单词的要求');
  } else {
    console.log('  ⚠️  发现以下问题:');
    keywordIssues.forEach(issue => console.log(`    - ${issue}`));
  }

  // Check diversity
  console.log('\n🎨 内容多样性分析:');
  const titleWords = new Set();
  articles.forEach(a => {
    a.topic.toLowerCase().split(' ').forEach(word => {
      if (word.length > 3) titleWords.add(word);
    });
  });
  console.log(`  • 标题中的独特词汇: ${titleWords.size} 个`);
  console.log(`  • 平均每篇文章: ${(titleWords.size / articles.length).toFixed(1)} 个独特词`);

  // Check for placeholder content
  const placeholders = articles.filter(a => a.topic.includes('Article 25'));
  if (placeholders.length > 0) {
    console.log('\n⚠️  发现占位符内容:');
    placeholders.forEach(a => {
      console.log(`  - "${a.topic}" (分类: ${a.category})`);
    });
  }
}