import { ARTICLE_GENERATION_CONFIG } from './config.template.js';

console.log('Testing ARTICLE_GENERATION_CONFIG readability:\n');
console.log('✅ Config enabled:', ARTICLE_GENERATION_CONFIG.enabled);
console.log('✅ Total articles:', ARTICLE_GENERATION_CONFIG.articles.length);

console.log('\n📝 First 5 articles:');
ARTICLE_GENERATION_CONFIG.articles.slice(0, 5).forEach((article, i) => {
  console.log(`${i + 1}. ${article.topic}`);
  console.log(`   Category: ${article.category}`);
  console.log(`   Keywords: ${article.keywords.join(', ')}`);
});

console.log('\n📊 Category distribution:');
const categoryCount = {};
ARTICLE_GENERATION_CONFIG.articles.forEach(article => {
  categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
});
Object.entries(categoryCount).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count} articles`);
});

console.log('\n✅ Config structure is valid for generate-articles.js');