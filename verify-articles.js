import fs from 'fs';

const content = fs.readFileSync('./config.template.js', 'utf-8');

// Extract categories
const catMatch = content.match(/"categories":\s*\[([\s\S]*?)\]/);
const categories = [];
if (catMatch) {
  const matches = catMatch[1].matchAll(/"([^"]+)"/g);
  for (const m of matches) {
    categories.push(m[1]);
  }
}

// Extract articles
const articleMatch = content.match(/export const ARTICLE_GENERATION_CONFIG = \{[\s\S]*?"articles":\s*\[([\s\S]*?)\s*\]\s*\}/);
const articles = [];
if (articleMatch) {
  const articlesSection = articleMatch[1];
  const articleBlocks = articlesSection.split(/\},\s*\{/);
  
  for (const block of articleBlocks) {
    const categoryMatch = block.match(/"category":\s*"([^"]+)"/);
    if (categoryMatch) {
      articles.push({ category: categoryMatch[1] });
    }
  }
}

console.log('Categories from CURRENT_WEBSITE_CONTENT:', categories);
console.log('\nArticles per category:');
const counts = {};
articles.forEach(a => counts[a.category] = (counts[a.category] || 0) + 1);
Object.entries(counts).forEach(([cat, count]) => console.log(`  ${cat}: ${count} articles`));

const invalid = articles.filter(a => !categories.includes(a.category)).map(a => a.category);
if (invalid.length > 0) {
  console.log('\n❌ Invalid categories found:', invalid);
} else {
  console.log('\n✅ All articles use valid categories!');
}
console.log(`\nTotal articles: ${articles.length}`);