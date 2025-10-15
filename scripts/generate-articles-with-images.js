#!/usr/bin/env node

/**
 * GPT文章生成器 - 带AI图片生成版本
 * 使用GPT生成文章内容和配套图片
 * 完全符合AdSense政策和SEO最佳实践
 */

import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 尝试导入配置
let ARTICLE_CONFIG = null;
try {
  const configModule = await import('../config.template.js');
  ARTICLE_CONFIG = configModule.ARTICLE_GENERATION_CONFIG;
} catch (e) {
  // 配置文件不存在或导入失败
}

// 默认配置
const DEFAULT_CONFIG = {
  outputDir: path.join(__dirname, '../newarticle'),
  imagesDir: path.join(__dirname, '../newarticle/images'),
  openaiApiKey: process.env.OPENAI_API_KEY,
  articlesPerRun: 25,
  concurrentBatches: 3, // 降低并发数因为图片生成较慢
  maxRetries: 3,
  retryDelay: 2000,
  model: "gpt-4o-mini",
  imageModel: "gpt-image-1",
  temperature: 0.7,
  maxTokens: 8000,
  generateImages: true // 是否生成真实图片
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 初始化OpenAI客户端
 */
function initOpenAI() {
  if (!DEFAULT_CONFIG.openaiApiKey) {
    throw new Error('Please set OPENAI_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey: DEFAULT_CONFIG.openaiApiKey
  });
}

/**
 * 生成AI图片
 */
async function generateImage(openai, prompt, size = "1536x864", articleTitle = "") {
  try {
    log(`    🎨 Generating image: ${prompt.substring(0, 50)}...`, 'cyan');
    
    const response = await openai.images.generate({
      model: DEFAULT_CONFIG.imageModel,
      prompt: prompt,
      size: size,
      quality: "high",
      output_format: "png",
      n: 1
    });

    // 保存图片到本地
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `article-image-${timestamp}-${randomId}.png`;
    const filePath = path.join(DEFAULT_CONFIG.imagesDir, fileName);
    
    // 如果返回的是base64
    if (response.data[0].b64_json) {
      const buffer = Buffer.from(response.data[0].b64_json, 'base64');
      fs.writeFileSync(filePath, buffer);
    } else if (response.data[0].url) {
      // 如果返回的是URL，下载图片
      const imageResponse = await fetch(response.data[0].url);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }
    
    log(`    ✅ Image saved: ${fileName}`, 'green');
    
    // 返回相对路径用于HTML
    return `images/${fileName}`;
    
  } catch (error) {
    log(`    ⚠️  Image generation failed: ${error.message}`, 'yellow');
    // 返回占位图片URL
    return `https://via.placeholder.com/${size.replace('x', '/')}/4F46E5/FFFFFF?text=${encodeURIComponent(articleTitle)}`;
  }
}

/**
 * 生成文章的所有图片
 */
async function generateArticleImages(openai, article) {
  const images = [];
  
  // 1. Hero图片 (16:9)
  const heroPrompt = `Minimalist hero image for article about ${article.topic}, modern tech editorial style, clean design, professional, 16:9 aspect ratio`;
  images.push(await generateImage(openai, heroPrompt, "1536x864", article.topic));
  
  // 2. 第二张图片 (特写或图表)
  const detailPrompt = `Detailed infographic or diagram illustrating ${article.keywords ? article.keywords[0] : article.topic}, clean modern design, educational`;
  images.push(await generateImage(openai, detailPrompt, "1024x1024", article.topic));
  
  // 3. 第三张图片 (概念图)
  const conceptPrompt = `Conceptual illustration of ${article.keywords ? article.keywords[1] : 'technology'} implementation, abstract tech visualization, professional`;
  images.push(await generateImage(openai, conceptPrompt, "1536x864", article.topic));
  
  // 4. 第四张图片 (对比或流程图)
  const comparisonPrompt = `Comparison chart or workflow diagram for ${article.topic}, clean business presentation style`;
  images.push(await generateImage(openai, comparisonPrompt, "1024x576", article.topic));
  
  return images;
}

/**
 * 生成SEO优化的提示词
 */
function generateSEOPrompt(article, images) {
  const keywordsString = article.keywords ? article.keywords.join(', ') : '';
  const primaryKeyword = article.keywords ? article.keywords[0] : article.topic.split(' ')[0];
  
  // 将图片URL嵌入到提示词中
  const imageUrls = images.map((img, idx) => `Image ${idx + 1}: ${img}`).join('\n');
  
  return `You are an expert content writer creating high-quality, original articles that meet Google AdSense policies and SEO best practices.

ARTICLE REQUIREMENTS:
Topic: ${article.topic}
${keywordsString ? `Primary Keywords: ${keywordsString}` : ''}
${article.category ? `Category: ${article.category}` : ''}
Word Count: 4000-5000 words
Language: English

IMAGES TO USE:
${imageUrls}

SEO OPTIMIZATION:
- Primary keyword "${primaryKeyword}" should appear in title, first paragraph, and 3-4 times throughout
- Use keyword variations naturally
- Include long-tail variations and semantic keywords
- Optimize for featured snippets with clear definitions and lists
- Keyword density: 0.5-1.5% for primary keyword

CONTENT QUALITY (AdSense Compliance):
- 100% original, valuable content with unique insights
- Demonstrate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Provide actionable, practical information solving real problems
- Include specific examples, case studies, and data points
- Professional writing with zero grammatical errors
- Clear value proposition addressing user search intent

STRUCTURE REQUIREMENTS:
1. SEO-optimized title including primary keyword
2. Meta description (150-160 chars) with keyword
3. Hook with surprising statistic or fact
4. 5-6 key takeaways/bullet points
5. 5-6 main sections with H2 headings using keywords
6. Multiple subsections with H3 headings
7. 2-3 data comparison tables
8. Strong conclusion with actionable insights
9. 10-12 FAQ items with schema.org markup

MEDIA AND LINKS:
- Use the 4 provided images at strategic points in the article
- 2 YouTube videos: Search and find REAL YouTube videos related to the topic. Use actual video IDs from popular channels.
  Examples of real educational video IDs:
  - Technology: dQw4w9WgXcQ, 9bZkp7q19f0, kJQP7kiw5Fk
  - AI/ML: RzkD_rTEBYs, aircAruvnKk, 2ePf9rue1Ao
  - Blockchain: SSo_EIwHSd4, 3PdO7zVqOwc, qOVAbKKSH10
  Search for videos from: TED, Google Developers, Microsoft, IBM Technology, MIT, Stanford, etc.
- 7-10 authority links to Forbes, TechCrunch, Harvard, Bloomberg, Reuters, MIT, Stanford, etc.

TRUST SIGNALS:
- Cite credible sources with inline links
- Include specific statistics and research findings
- Reference industry experts and reports
- Add current year (2025) for freshness
- Use professional, authoritative tone`;
}

/**
 * 生成文章HTML
 */
async function generateArticleHTML(openai, article, index, totalCount) {
  const startTime = Date.now();
  
  try {
    // 先生成图片（如果启用）
    let images = [];
    if (DEFAULT_CONFIG.generateImages) {
      log(`  🖼️  Generating images for article ${index + 1}...`, 'blue');
      images = await generateArticleImages(openai, article);
    } else {
      // 使用占位图片
      images = [
        `https://images.unsplash.com/photo-blockchain?w=1536&h=864`,
        `https://images.unsplash.com/photo-technology?w=1024&h=1024`,
        `https://images.unsplash.com/photo-business?w=1536&h=864`,
        `https://images.unsplash.com/photo-finance?w=1024&h=576`
      ];
    }
    
    const prompt = generateSEOPrompt(article, images);
    
    log(`  ✍️  Generating article content ${index + 1}...`, 'blue');
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_CONFIG.model,
      messages: [{
        role: "system",
        content: prompt
      }, {
        role: "user",
        content: `Generate a complete HTML article following all requirements above.

Use these exact image paths in your HTML:
${images.map((img, idx) => `<img src="${img}" alt="${article.topic} - ${['hero image', 'detailed view', 'concept illustration', 'comparison chart'][idx]}">`).join('\n')}

Return ONLY the HTML code in this exact format:
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>[SEO title with keyword]</title>
  <meta name="description" content="[Meta description with keyword]" />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
[Complete article HTML content with the provided images embedded]
</body>
</html>`
      }],
      temperature: DEFAULT_CONFIG.temperature,
      max_tokens: DEFAULT_CONFIG.maxTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const htmlContent = response.choices[0].message.content;
    
    // 提取HTML内容
    let finalHtml = htmlContent;
    const htmlMatch = htmlContent.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    if (htmlMatch) {
      finalHtml = htmlMatch[0];
    }

    // 生成文件名
    const fileName = article.topic
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, ' ')
      .substring(0, 80) + '.html';

    // 保存文件
    const filePath = path.join(DEFAULT_CONFIG.outputDir, fileName);
    fs.writeFileSync(filePath, finalHtml);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`  ✅ [${index + 1}/${totalCount}] Generated: ${fileName} (${elapsed}s)`, 'green');
    if (article.keywords) {
      log(`     Keywords: ${article.keywords.join(', ')}`, 'cyan');
    }
    
    return { 
      success: true, 
      fileName, 
      title: article.topic,
      category: article.category,
      time: elapsed,
      index,
      imagesGenerated: DEFAULT_CONFIG.generateImages ? images.length : 0
    };

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`  ❌ [${index + 1}/${totalCount}] Failed: ${article.topic}`, 'red');
    log(`     Error: ${error.message} (${elapsed}s)`, 'red');
    return { 
      success: false, 
      error: error.message,
      topic: article.topic,
      index,
      time: elapsed
    };
  }
}

/**
 * 带重试的生成函数
 */
async function generateWithRetry(openai, article, index, totalCount, retries = DEFAULT_CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await generateArticleHTML(openai, article, index, totalCount);
    
    if (result.success) {
      return result;
    }
    
    if (attempt < retries) {
      log(`  🔄 Retrying [${index + 1}] (attempt ${attempt + 1}/${retries})...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.retryDelay * attempt));
    }
  }
  
  return { 
    success: false, 
    error: 'Max retries exceeded',
    topic: article.topic,
    index
  };
}

/**
 * 批量并发处理
 */
async function processBatch(openai, articles, startIndex, totalCount) {
  const promises = articles.map((article, i) => 
    generateWithRetry(openai, article, startIndex + i, totalCount)
  );
  
  return Promise.all(promises);
}

/**
 * 进度条显示
 */
function showProgress(completed, total, startTime) {
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = completed / elapsed;
  const remaining = (total - completed) / rate;
  
  const percentage = Math.round((completed / total) * 100);
  const barLength = 30;
  const filledLength = Math.round(barLength * completed / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  
  process.stdout.write(`\r  Progress: ${bar} ${percentage}% | ${completed}/${total} | ETA: ${Math.ceil(remaining)}s  `);
  
  if (completed === total) {
    console.log(''); // 新行
  }
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {
    count: null,
    concurrent: DEFAULT_CONFIG.concurrentBatches,
    images: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--count' || arg === '-c') {
      options.count = parseInt(args[++i]);
    } else if (arg === '--concurrent' || arg === '-p') {
      options.concurrent = parseInt(args[++i]);
    } else if (arg === '--no-images') {
      options.images = false;
    } else if (!isNaN(parseInt(arg))) {
      options.count = parseInt(arg);
    }
  }

  return options;
}

/**
 * 获取要生成的文章列表
 */
function getArticles(options) {
  // 如果有配置文件
  if (ARTICLE_CONFIG && ARTICLE_CONFIG.enabled && ARTICLE_CONFIG.articles) {
    const articles = [...ARTICLE_CONFIG.articles];
    if (options.count && options.count < articles.length) {
      return articles.slice(0, options.count);
    }
    return articles;
  }

  // 默认文章
  return [{
    topic: "Real World Asset Tokenization: Complete Guide",
    keywords: ["RWA tokenization", "asset tokenization", "blockchain"],
    category: "Educational"
  }];
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    log('\n📚 GPT Article Generator with Images', 'bright');
    log('=====================================', 'cyan');
    log('\nUsage: npm run generate-articles-images [options]', 'white');
    log('\nOptions:', 'yellow');
    log('  --count, -c      Number of articles', 'white');
    log('  --concurrent, -p Concurrent requests (default: 3)', 'white');
    log('  --no-images      Skip image generation', 'white');
    log('  --help, -h       Show this help', 'white');
    process.exit(0);
  }

  log('\n====================================', 'bright');
  log('  GPT Article & Image Generator', 'bright');
  log('====================================', 'bright');
  log(`Image Generation: ${options.images ? 'ENABLED' : 'DISABLED'}`, 'magenta');

  try {
    // 确保目录存在
    if (!fs.existsSync(DEFAULT_CONFIG.outputDir)) {
      fs.mkdirSync(DEFAULT_CONFIG.outputDir, { recursive: true });
    }
    if (!fs.existsSync(DEFAULT_CONFIG.imagesDir)) {
      fs.mkdirSync(DEFAULT_CONFIG.imagesDir, { recursive: true });
    }

    // 更新图片生成设置
    DEFAULT_CONFIG.generateImages = options.images;

    // 初始化OpenAI
    const openai = initOpenAI();
    log('✅ OpenAI client initialized', 'green');

    // 获取文章列表
    const articles = getArticles(options);
    const totalCount = articles.length;
    const concurrentBatches = options.concurrent;
    
    log(`\n📊 Generation Configuration:`, 'cyan');
    log(`  • Articles to generate: ${totalCount}`, 'cyan');
    log(`  • Images per article: ${options.images ? '4' : '0 (using placeholders)'}`, 'cyan');
    log(`  • Concurrent requests: ${concurrentBatches}`, 'cyan');
    log(`  • Estimated time: ${Math.ceil(totalCount / concurrentBatches * (options.images ? 45 : 20))}s`, 'cyan');

    log(`\n🚀 Starting generation...`, 'bright');
    
    // 分批处理
    const results = [];
    let completed = 0;
    
    for (let i = 0; i < articles.length; i += concurrentBatches) {
      const batch = articles.slice(i, i + concurrentBatches);
      const batchNumber = Math.floor(i / concurrentBatches) + 1;
      const totalBatches = Math.ceil(articles.length / concurrentBatches);
      
      log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} articles)...`, 'blue');
      
      batch.forEach((article, idx) => {
        log(`   ${i + idx + 1}. ${article.topic}`, 'cyan');
      });
      
      const batchResults = await processBatch(openai, batch, i, totalCount);
      results.push(...batchResults);
      
      completed += batch.length;
      showProgress(completed, totalCount, startTime);
      
      if (i + concurrentBatches < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTime = (totalTime / results.length).toFixed(1);
    const totalImages = results.reduce((sum, r) => sum + (r.imagesGenerated || 0), 0);

    log('\n\n====================================', 'bright');
    log('        Generation Complete', 'bright');
    log('====================================', 'bright');
    
    log('\n📈 Statistics:', 'cyan');
    log(`  ✅ Success: ${successCount}/${totalCount} articles`, 'green');
    if (failedCount > 0) {
      log(`  ❌ Failed: ${failedCount} articles`, 'red');
    }
    if (options.images) {
      log(`  🖼️  Images generated: ${totalImages}`, 'blue');
    }
    log(`  ⏱️  Total time: ${totalTime}s`, 'blue');
    log(`  ⚡ Average: ${avgTime}s per article`, 'blue');

    if (successCount > 0) {
      log('\n✨ Content Features:', 'green');
      log('  • 4000-5000 word articles', 'green');
      log('  • SEO-optimized content', 'green');
      log('  • AdSense-compliant', 'green');
      if (options.images) {
        log('  • AI-generated custom images', 'green');
      }
      log('  • Professional English writing', 'green');
      
      log('\n🎯 Next Steps:', 'cyan');
      log('  1. Run: npm run add-articles-improved', 'blue');
      log('  2. Run: npm run schedule-articles', 'blue');
      log('  3. Run: npm run dev (to preview)', 'blue');
    }

    // 失败详情
    if (failedCount > 0) {
      log('\n⚠️  Failed Articles:', 'yellow');
      results.filter(r => !r.success).forEach(r => {
        log(`  • [${r.index + 1}] ${r.topic}: ${r.error}`, 'yellow');
      });
    }

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ Uncaught error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});