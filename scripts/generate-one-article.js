import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 颜色输出函数
const log = (message, color = 'white') => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || colors.white}${message}${colors.reset}`);
};

/**
 * 混合方案生成图片：第一张用DALL-E，其他用Lorem Picsum
 */
async function generateHybridImages(openai, topic, keywords) {
  const images = [];
  
  // 第一张用DALL-E生成主图（10秒超时）
  try {
    log('    🎨 Generating AI hero image...', 'blue');
    const heroResponse = await Promise.race([
      openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional hero image for article about ${topic}, modern business illustration style, clean and engaging, high quality`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DALL-E timeout after 10s')), 10000))
    ]);
    images.push(heroResponse.data[0].url);
    log('    ✅ AI hero image generated successfully', 'green');
  } catch (error) {
    log(`    ⚠️  DALL-E failed (${error.message}), using high-quality placeholder`, 'yellow');
    images.push(`https://picsum.photos/1024/576?random=${Date.now()}`);
  }
  
  // 其他图片使用Lorem Picsum（更可靠的随机图片服务）
  for (let i = 0; i < 3; i++) {
    images.push(`https://picsum.photos/1024/576?random=${Date.now() + i + 1}`);
  }
  
  log('    🖼️  All images prepared (1 AI + 3 Lorem Picsum)', 'green');
  return images;
}

/**
 * 生成文章大纲
 */
function generateArticleOutline(article) {
  const keywordsString = article.keywords ? article.keywords.join(', ') : '';
  const primaryKeyword = article.keywords ? article.keywords[0] : article.topic.split(' ')[0];
  
  return `Create a detailed outline for a comprehensive article about "${article.topic}".

Generate a JSON outline with this EXACT structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaDescription": "150-160 character meta description with keyword",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": ["Subsection 1", "Subsection 2", "Subsection 3"]
    }
  ]
}

Requirements:
- Title must include the main keyword "${primaryKeyword}"
- Meta description must be 150-160 characters
- Create 7-8 main sections with 2-3 subsections each
- Make section headings clear and informative`;
}

/**
 * 生成单篇文章
 */
async function generateSingleArticle() {
  log('\n🚀 Starting Final Article Generation...', 'cyan');
  log('====================================', 'blue');
  
  const article = {
    topic: "Blockchain Infrastructure for Asset Tokenization",
    keywords: ["blockchain infrastructure", "asset tokenization", "distributed ledger", "smart contracts"],
    category: "Technical"
  };
  
  try {
    // 生成图片
    const images = await generateHybridImages(openai, article.topic, article.keywords);
    
    // Step 1: 生成文章大纲
    log('     📋 Generating outline...', 'blue');
    const outlineResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: generateArticleOutline(article)
      }],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const outlineText = outlineResponse.choices[0].message.content;
    const cleanedOutline = outlineText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const outline = JSON.parse(cleanedOutline);
    
    log(`     ✅ Outline generated: ${outline.sections.length} sections`, 'green');
    
    // 构建HTML内容
    let fullContent = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${outline.title}</title>
  <meta name="description" content="${outline.metaDescription || 'Comprehensive guide on ' + article.topic}" />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
<h1>${outline.title}</h1>

`;
    
    // Step 2: 生成引言
    log('     ✍️  Generating introduction...', 'blue');
    const introPrompt = `Write a compelling 400-word introduction for an article titled "${outline.title}".

Requirements:
- Open with a hook that grabs attention
- Introduce the main topic and its importance
- Include keywords naturally: ${article.keywords.join(', ')}
- End with what the article will cover
- Write in clear, professional English
- Do NOT include any code block markers or formatting tags`;

    const introResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: introPrompt }],
      temperature: 0.7,
      max_tokens: 800
    });
    
    fullContent += '<h2>Introduction</h2>\n';
    fullContent += introResponse.choices[0].message.content.split('\n')
      .filter(p => p.trim())
      .map(p => `<p>${p}</p>`)
      .join('\n');
    fullContent += `\n\n<img src="${images[0]}" alt="${article.topic}" />\n\n`;
    
    // Step 3: 生成每个章节
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      const sectionTitle = section.heading || section.title || `Section ${i + 1}`;
      
      log(`     ✍️  Generating section ${i + 1}/${outline.sections.length}: ${sectionTitle}...`, 'blue');
      
      const sectionPrompt = `Write a comprehensive 600-800 word section for "${sectionTitle}" in an article about ${article.topic}.

${section.subsections && section.subsections.length > 0 ? `Cover these subsections:
${section.subsections.map(s => `- ${s}`).join('\n')}` : ''}

Requirements:
- Write detailed, informative content
- Include specific examples and data where relevant
- Use keywords naturally: ${article.keywords.join(', ')}
- Format with HTML tags: <h2> for main heading, <h3> for subsections, <p> for paragraphs, <ul>/<ol> for lists
- Make content actionable and valuable
- Do NOT include any code block markers`;

      const sectionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: sectionPrompt }],
        temperature: 0.7,
        max_tokens: 1800
      });
      
      fullContent += sectionResponse.choices[0].message.content + '\n\n';
      
      // 在偶数章节后添加图片
      if (i === 1) fullContent += `<img src="${images[1]}" alt="${sectionTitle}" />\n\n`;
      if (i === 3) fullContent += `<img src="${images[2]}" alt="${sectionTitle}" />\n\n`;
    }
    
    // Step 4: 生成结论
    log('     ✍️  Generating conclusion...', 'blue');
    const conclusionPrompt = `Write a compelling 400-word conclusion for an article about "${article.topic}".

Summarize key points covered:
${outline.sections.map(s => `- ${s.heading || s.title}`).join('\n')}

Requirements:
- Synthesize main insights
- Provide actionable next steps
- Include call to action
- Reinforce article value
- Use HTML formatting
- Do NOT include code block markers`;

    const conclusionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: conclusionPrompt }],
      temperature: 0.7,
      max_tokens: 800
    });
    
    fullContent += '<h2>Conclusion</h2>\n';
    fullContent += conclusionResponse.choices[0].message.content + '\n\n';
    fullContent += `<img src="${images[3]}" alt="${article.topic} Summary" />\n\n`;
    
    // Step 5: 生成FAQ
    log('     ✍️  Generating FAQs...', 'blue');
    const faqPrompt = `Generate 6 comprehensive FAQs for an article about "${article.topic}".

Format as HTML:
<h2>Frequently Asked Questions</h2>
<h3>Question 1?</h3>
<p>Detailed answer...</p>

Requirements:
- Each answer 100-150 words
- Cover different aspects
- Provide valuable information
- No code block markers`;

    const faqResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: faqPrompt }],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    fullContent += faqResponse.choices[0].message.content;
    fullContent += '\n</body>\n</html>';
    
    // 清理代码块标记
    fullContent = fullContent.replace(/```html\n?/g, '').replace(/\n?```/g, '');
    
    // 保存文件
    const outputDir = path.join(__dirname, '..', 'newarticle');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = 'Blockchain Infrastructure for Asset Tokenization.html';
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, fullContent, 'utf-8');
    
    // 计算字数
    const textContent = fullContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    
    log('\n✅ Article Generated Successfully!', 'green');
    log('====================================', 'blue');
    log(`📁 File: ${fileName}`, 'cyan');
    log(`📊 Word Count: ${wordCount} words`, 'cyan');
    log(`📑 Sections: ${outline.sections.length}`, 'cyan');
    log(`🖼️ Images: ${images.length} (Lorem Picsum)`, 'cyan');
    
    // 显示图片URL
    log('\n🔗 Image URLs:', 'yellow');
    images.forEach((url, i) => {
      const isLorem = url.includes('picsum.photos');
      log(`  ${i + 1}. ${isLorem ? '✅ Lorem Picsum' : '🎨 DALL-E'}: ${url.substring(0, 60)}...`, 'white');
    });
    
    log('\n🎉 Success! Article ready for use.', 'green');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    if (error.response) {
      log('API Response:', 'red');
      console.error(error.response.data);
    }
    process.exit(1);
  }
}

// 运行生成
generateSingleArticle();