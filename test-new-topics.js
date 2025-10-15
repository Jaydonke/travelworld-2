import { CURRENT_WEBSITE_CONTENT, ARTICLE_GENERATION_CONFIG } from './config.template.js';

console.log('Testing generate-new-topics compatibility:\n');

// Check if CURRENT_WEBSITE_CONTENT has the expected structure
console.log('1. Checking CURRENT_WEBSITE_CONTENT structure:');
console.log('   - Has name:', !!CURRENT_WEBSITE_CONTENT.title);
console.log('   - Has tagline:', !!CURRENT_WEBSITE_CONTENT.tagline);
console.log('   - Has categories:', !!CURRENT_WEBSITE_CONTENT.categories);
console.log('   - Categories:', CURRENT_WEBSITE_CONTENT.categories);

// Check if articles are accessible
console.log('\n2. Checking articles location:');
console.log('   - CURRENT_WEBSITE_CONTENT.articles exists:', !!CURRENT_WEBSITE_CONTENT.articles);
console.log('   - ARTICLE_GENERATION_CONFIG.articles exists:', !!ARTICLE_GENERATION_CONFIG.articles);

// The issue: generate-new-topics looks for config.articles but articles are in ARTICLE_GENERATION_CONFIG
console.log('\n3. Issue identified:');
console.log('   ❌ generate-new-topics.js looks for config.articles (line 103)');
console.log('   ❌ But articles are in ARTICLE_GENERATION_CONFIG.articles');
console.log('   ❌ Also uses wrong location in line 278: "Find the \'articles\' array in CURRENT_WEBSITE_CONTENT"');

console.log('\n4. What needs to be fixed:');
console.log('   - Update generate-new-topics.js to also import ARTICLE_GENERATION_CONFIG');
console.log('   - Use ARTICLE_GENERATION_CONFIG.articles instead of config.articles');
console.log('   - Update add-topics-to-config.js to modify ARTICLE_GENERATION_CONFIG');

// Show existing topics
console.log('\n5. Current articles (first 3):');
ARTICLE_GENERATION_CONFIG.articles.slice(0, 3).forEach((a, i) => {
  console.log(`   ${i+1}. ${a.topic} (${a.category})`);
});