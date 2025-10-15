console.log('对比 generate-articles.js 和 generate-new-topics.js:\n');

console.log('=== generate-articles.js ===');
console.log('第27-28行:');
console.log('  const configModule = await import("../config.template.js");');
console.log('  ARTICLE_CONFIG = configModule.ARTICLE_GENERATION_CONFIG;');
console.log('  ↑ 直接导入 ARTICLE_GENERATION_CONFIG\n');

console.log('第1596-1597行 - 使用文章:');
console.log('  if (ARTICLE_CONFIG && ARTICLE_CONFIG.enabled && ARTICLE_CONFIG.articles) {');
console.log('    const articles = [...ARTICLE_CONFIG.articles];');
console.log('  ↑ 从 ARTICLE_CONFIG.articles 读取文章\n');

console.log('=== generate-new-topics.js ===');
console.log('第66-73行:');
console.log('  const configModule = await import("../config.template.js");');
console.log('  if (!configModule.CURRENT_WEBSITE_CONTENT) {...}');
console.log('  return configModule.CURRENT_WEBSITE_CONTENT;');
console.log('  ↑ 导入 CURRENT_WEBSITE_CONTENT\n');

console.log('第103-106行 - 使用文章:');
console.log('  if (config.articles && Array.isArray(config.articles)) {');
console.log('    config.articles.forEach(article => {...});');
console.log('  ↑ 从 config.articles 读取文章 (config = CURRENT_WEBSITE_CONTENT)\n');

console.log('=== 关键差异 ===');
console.log('✅ generate-articles 正确读取:');
console.log('   因为它导入的是 ARTICLE_GENERATION_CONFIG');
console.log('   文章在 ARTICLE_GENERATION_CONFIG.articles\n');

console.log('❌ generate-new-topics 无法读取:');
console.log('   因为它导入的是 CURRENT_WEBSITE_CONTENT');
console.log('   但文章不在 CURRENT_WEBSITE_CONTENT.articles');
console.log('   文章实际在 ARTICLE_GENERATION_CONFIG.articles\n');

console.log('结论:');
console.log('generate-articles 能正确工作是因为它直接导入了 ARTICLE_GENERATION_CONFIG');
console.log('generate-new-topics 不能工作是因为它只导入了 CURRENT_WEBSITE_CONTENT');