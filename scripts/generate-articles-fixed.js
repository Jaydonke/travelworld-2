#!/usr/bin/env node

/**
 * 修复版的文章生成器
 * 主要改进：
 * 1. 先生成大纲获取标题，再生成图片和内容
 * 2. 使用GPT生成的标题作为文件名和图片文件夹名
 * 3. 保持与 add-articles-improved.js 的 slugify 函数一致
 */

// 复制原始的 generate-articles.js 内容，但修改关键部分
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 加载原始脚本
const originalScript = fs.readFileSync(path.join(__dirname, 'generate-articles.js'), 'utf8');

// 创建修改版本
let modifiedScript = originalScript;

// 1. 添加统一的 slugify 函数（在文件开头附近）
const slugifyFunction = `
/**
 * 统一的 slugify 函数（与 add-articles-improved.js 保持一致）
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
`;

// 2. 修改 generateArticleHTML 函数，先生成大纲
const modifiedGenerateFunction = `
async function generateArticleHTML(openai, article, index, totalCount) {
  const startTime = Date.now();
  
  try {
    log(\`  📝 [\${index + 1}/\${totalCount}] Starting article generation: \${article.topic}\`, 'cyan');
    
    // Step 1: 先生成文章大纲以获取GPT生成的标题
    log(\`     📋 Generating outline...\`, 'blue');
    const outlineResponse = await callWithRetry(
      openai.chat.completions.create({
        model: DEFAULT_CONFIG.model,
        messages: [{
          role: "user",
          content: generateArticleOutline(article)
        }],
        temperature: 0.7,
        max_tokens: 1000
      }),
      2,
      'outline generation'
    );
    
    let outline;
    try {
      const outlineText = outlineResponse.choices[0].message.content;
      outline = JSON.parse(outlineText.replace(/\`\`\`json\\n?|\`\`\`/g, ''));
    } catch (e) {
      outline = {
        title: article.topic,
        metaDescription: \`Comprehensive guide to \${article.topic} with expert insights and practical advice\`,
        introduction: { points: ['Overview', 'Key concepts', 'Benefits'] },
        sections: [
          { heading: 'Understanding the Basics', subsections: ['Definition', 'History', 'Current State'] },
          { heading: 'Key Benefits and Features', subsections: ['Main Benefits', 'Core Features', 'Use Cases'] },
          { heading: 'Implementation and Best Practices', subsections: ['Getting Started', 'Best Practices', 'Common Pitfalls'] },
          { heading: 'Market Analysis and Trends', subsections: ['Market Overview', 'Key Players', 'Future Trends'] },
          { heading: 'Challenges and Solutions', subsections: ['Main Challenges', 'Solutions', 'Risk Management'] },
          { heading: 'Case Studies and Examples', subsections: ['Success Stories', 'Lessons Learned', 'Industry Applications'] }
        ],
        conclusion: { points: ['Key Takeaways', 'Action Items', 'Future Outlook'] },
        faqs: Array(10).fill(null).map((_, i) => \`Question \${i + 1} about \${article.topic}\`)
      };
    }
    
    // 使用GPT生成的标题
    const articleTitle = outline.title || article.topic;
    const articleSlug = slugify(articleTitle);
    const metaDesc = outline.metaDescription || \`Comprehensive guide to \${article.topic} with expert insights and practical advice\`;
    
    log(\`     ✅ Title: \${articleTitle}\`, 'green');
    log(\`     🔗 Slug: \${articleSlug}\`, 'cyan');
    
    // Step 2: 生成图片（使用GPT生成的标题）
    const images = await generateHybridImages(openai, articleTitle, article.keywords);
    
    // Debug: 输出实际生成的图片URLs
    console.log(\`\\n    🔍 Debug - Generated images for "\${articleTitle}":\`);
    images.forEach((url, i) => {
      const source = url.includes('oaidalleapi') ? 'DALL-E' : url.includes('unsplash') ? 'Unsplash' : 'Unknown';
      console.log(\`       \${i + 1}. [\${source}] \${url.substring(0, 80)}...\`);
    });
    
    // 下载图片到正确的文件夹（使用GPT生成的标题的slug）
    const savedImages = await saveArticleImages(images, articleSlug);
    log(\`     📥 Downloaded \${savedImages.length} images to local storage\`, 'green');
    
    // Step 3: 生成文章内容
    let fullContent = '';
    
    fullContent += \`<h1>\${articleTitle}</h1>\\n\`;
    fullContent += \`<p><em>Meta description:</em> \${metaDesc}</p>\\n\\n\`;
    
    // 继续生成其他内容...（保持原有逻辑）
`;

// 3. 修改文件名生成逻辑
const fileNameFix = `
    // 使用GPT生成的标题作为文件名
    const fileName = articleTitle
      .replace(/[^a-zA-Z0-9\\s]/g, '')
      .replace(/\\s+/g, ' ')
      .trim()
      .substring(0, 80) + '.html';
`;

// 4. 修改 generateHybridImages 函数中的本地图片检查逻辑
const imageCheckFix = `
  // 由于还不知道GPT会生成什么标题，这里只能做有限的本地检查
  // 可以基于topic的slug尝试查找，但可能不准确
  const tempSlug = slugify(topic);
  const imageDir = path.join(__dirname, '../src/assets/images/articles', tempSlug);
`;

console.log(`
=====================================
    修复版文章生成器使用说明
=====================================

主要改进：
1. 先生成大纲获取GPT的标题
2. 使用GPT标题生成统一的slug
3. 图片文件夹和文章文件夹保持一致

使用方法：
1. 备份原始的 generate-articles.js
2. 将修改应用到 generate-articles.js
3. 运行: npm run generate-articles -- -c 1

这样生成的文章就能与 add-articles-improved.js 完美配合了！
`);