import { CURRENT_WEBSITE_CONTENT, ARTICLE_GENERATION_CONFIG } from './config.template.js';

console.log('分析 generate-new-topics.js 需要哪些字段:\n');

console.log('generate-new-topics.js 使用的字段:');
console.log('1. config.name (第148行) - 网站名称');
console.log('2. config.tagline (第149行) - 网站标语');
console.log('3. config.categories (第124行) - 分类列表');
console.log('4. config.articles (第103行) - 文章列表\n');

console.log('检查 CURRENT_WEBSITE_CONTENT 中的对应字段:');
console.log(`- name: "${CURRENT_WEBSITE_CONTENT.name}" ❌ (没有此字段)`);
console.log(`- title: "${CURRENT_WEBSITE_CONTENT.title}" ✅ (有此字段，应该用这个)`);
console.log(`- tagline: "${CURRENT_WEBSITE_CONTENT.tagline}" ✅`);
console.log(`- categories: [${CURRENT_WEBSITE_CONTENT.categories?.slice(0,3).join(', ')}...] ✅`);
console.log(`- articles: ${CURRENT_WEBSITE_CONTENT.articles} ❌ (没有此字段)\n`);

console.log('检查 ARTICLE_GENERATION_CONFIG:');
console.log(`- articles: ${ARTICLE_GENERATION_CONFIG.articles.length} 篇文章 ✅\n`);

console.log('结论:');
console.log('✅ generate-new-topics 需要 CURRENT_WEBSITE_CONTENT 来获取:');
console.log('   - title (当前用的是name)');
console.log('   - tagline (网站标语)');
console.log('   - categories (分类列表)');
console.log('\n✅ generate-new-topics 需要 ARTICLE_GENERATION_CONFIG 来获取:');
console.log('   - articles (现有文章列表，避免重复)');
console.log('\n所以两个都需要导入！');