#!/usr/bin/env node

/**
 * 统一的GPT文章生成器
 * 支持从配置文件读取、批量并发生成、自定义主题
 * 完全符合AdSense政策和SEO最佳实践
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import crypto from 'crypto';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 尝试导入配置（如果存在）
let ARTICLE_CONFIG = null;
try {
  const configModule = await import('../config.template.js');
  ARTICLE_CONFIG = configModule.ARTICLE_GENERATION_CONFIG;
} catch (e) {
  // 配置文件不存在或导入失败，使用默认配置
}

// 默认配置
const DEFAULT_CONFIG = {
  outputDir: path.join(__dirname, '../newarticle'),
  scheduledOutputDir: path.join(__dirname, '../scheduledarticle'),
  openaiApiKey: process.env.OPENAI_API_KEY,
  articlesPerRun: 25,
  concurrentBatches: 2,  // 降低并发数，从5改为2，减少API压力
  maxRetries: 3,
  retryDelay: 2000,
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2000,  // 降低到2000以避免超时
  fingerprintFile: path.join(__dirname, '../.article-fingerprints.json'),
  // 合并配置文件的设置（如果存在）
  ...(ARTICLE_CONFIG?.apiSettings || {})
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
 * 生成文章的唯一指纹
 */
function generateTopicFingerprint(article) {
  // 组合多个稳定因素
  const fingerprintSource = [
    article.topic.toLowerCase().replace(/[^a-z0-9]/g, ''),  // 标准化的主题
    article.category?.toLowerCase() || 'general',            // 类别
    (article.keywords || []).sort().join(',').toLowerCase()  // 排序后的关键词
  ].join('|');
  
  // 生成短哈希作为指纹
  const hash = crypto
    .createHash('md5')
    .update(fingerprintSource)
    .digest('hex')
    .substring(0, 12);  // 12位足够唯一
  
  return hash;
}

/**
 * 加载位置追踪文件
 */
function loadPositionTracker() {
  try {
    if (fs.existsSync(DEFAULT_CONFIG.fingerprintFile)) {
      const content = fs.readFileSync(DEFAULT_CONFIG.fingerprintFile, 'utf-8');
      const data = JSON.parse(content);
      
      // 兼容旧指纹格式，转换为位置追踪格式
      if (data.fingerprints && !data.processedPositions) {
        log('🔄 Converting old fingerprint format to position tracking...', 'yellow');
        return {
          version: '2.0',
          generated: new Date().toISOString(),
          processedPositions: [],
          totalArticles: 0,
          // 保留旧数据作为备份
          legacyFingerprints: data.fingerprints
        };
      }
      
      return data;
    }
  } catch (error) {
    log(`⚠️ Failed to load position tracker: ${error.message}`, 'yellow');
  }
  
  // 返回默认结构
  return {
    version: '2.0',
    generated: new Date().toISOString(),
    processedPositions: [],
    totalArticles: 0
  };
}

/**
 * 保存位置追踪文件
 */
function savePositionTracker(tracker) {
  try {
    tracker.generated = new Date().toISOString();
    fs.writeFileSync(
      DEFAULT_CONFIG.fingerprintFile, 
      JSON.stringify(tracker, null, 2)
    );
  } catch (error) {
    log(`⚠️ Failed to save position tracker: ${error.message}`, 'yellow');
  }
}

/**
 * 更新位置追踪
 */
function updatePositionTracker(tracker, position, article, generatedFile) {
  // 添加位置到已处理列表
  if (!tracker.processedPositions.includes(position)) {
    tracker.processedPositions.push(position);
  }
  
  // 更新总文章数
  tracker.totalArticles = Math.max(tracker.totalArticles, position + 1);
  
  // 记录详细信息（可选，用于调试）
  if (!tracker.processedDetails) {
    tracker.processedDetails = {};
  }
  
  tracker.processedDetails[position] = {
    originalTopic: article.topic,
    category: article.category,
    keywords: article.keywords || [],
    generated: {
      htmlFile: generatedFile,
      timestamp: new Date().toISOString()
    }
  };
  
  return tracker;
}

/**
 * 筛选未处理的文章
 */
function filterUnprocessedArticles(articles, tracker) {
  const unprocessed = [];
  const skipped = [];
  
  articles.forEach((article, index) => {
    if (tracker.processedPositions.includes(index)) {
      skipped.push({ index, topic: article.topic });
    } else {
      unprocessed.push({ article, index });
    }
  });
  
  return { unprocessed, skipped };
}

/**
 * 检查文章是否应该跳过 (已弃用 - 现在使用位置追踪)
 */
/*
function shouldSkipArticle(article, fingerprintMap, forceRegenerate = false) {
  // 此函数已被位置追踪系统替代
  // 保留用于兼容性，但不再使用
  return { skip: false, reason: 'deprecated' };
}
*/

/**
 * 显示帮助信息
 */
function showHelp() {
  log('\n📚 GPT Article Generator - Usage Guide', 'bright');
  log('=====================================', 'cyan');
  
  log('\n📝 Basic Usage:', 'yellow');
  log('  npm run generate-articles [count]', 'white');
  log('    Generate articles using config.template.js settings', 'white');
  log('    Default: 25 articles (or as configured)', 'white');
  
  log('\n⚙️  Options:', 'yellow');
  log('  --help, -h        Show this help message', 'white');
  log('  --count, -c       Number of articles to generate', 'white');
  log('  --concurrent, -p  Number of concurrent requests (default: 5)', 'white');
  log('  --topic, -t       Generate on a specific topic (overrides config)', 'white');
  log('  --scheduled, -s   Save to scheduledarticle folder instead of newarticle', 'white');
  log('  --skip, -k        Skip first N articles in config', 'white');
  log('  --force, -f       Force regenerate all articles (ignore fingerprints)', 'white');
  log('  --reset           Reset fingerprint database', 'white');
  
  log('\n📋 Examples:', 'yellow');
  log('  npm run generate-articles          # Use config settings', 'white');
  log('  npm run generate-articles 10       # Generate 10 articles', 'white');
  log('  npm run generate-articles -c 5 -p 2  # 5 articles, 2 concurrent', 'white');
  log('  npm run generate-articles -t "Cloud Computing"  # Custom topic', 'white');
  log('  npm run generate-articles -s        # Save to scheduledarticle folder', 'white');
  log('  npm run generate-articles -s -c 10  # Generate 10 scheduled articles', 'white');
  log('  npm run generate-articles -s -k 25 -c 15  # Skip first 25, generate next 15 scheduled', 'white');
  log('  npm run generate-articles --help    # Show this help', 'white');
  
  log('\n🔧 Configuration:', 'yellow');
  log('  Articles are configured in config.template.js', 'white');
  log('  Set OPENAI_API_KEY in .env file', 'white');
  
  log('\n✨ Features:', 'yellow');
  log('  • Reads from config.template.js for topics and keywords', 'white');
  log('  • Batch processing with concurrent API calls', 'white');
  log('  • SEO-optimized with keyword targeting', 'white');
  log('  • AdSense-compliant content generation', 'white');
  log('  • Automatic retry on failures', 'white');
  log('  • Progress tracking and statistics', 'white');
  
  process.exit(0);
}

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {
    count: null,
    concurrent: DEFAULT_CONFIG.concurrentBatches,
    topic: null,
    help: false,
    scheduled: false,
    skip: 0,
    force: false,
    reset: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--count' || arg === '-c') {
      options.count = parseInt(args[++i]);
    } else if (arg === '--concurrent' || arg === '-p') {
      options.concurrent = parseInt(args[++i]);
    } else if (arg === '--topic' || arg === '-t') {
      options.topic = args[++i];
    } else if (arg === '--scheduled' || arg === '-s') {
      options.scheduled = true;
    } else if (arg === '--skip' || arg === '-k') {
      options.skip = parseInt(args[++i]) || 0;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--reset') {
      options.reset = true;
    } else if (!isNaN(parseInt(arg))) {
      // 如果是纯数字，作为count
      options.count = parseInt(arg);
    }
  }

  return options;
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
 * 生成文章大纲
 */
function generateArticleOutline(article) {
  const keywordsString = article.keywords ? article.keywords.join(', ') : '';
  const primaryKeyword = article.keywords ? article.keywords[0] : article.topic.split(' ')[0];
  
  return `Create a detailed outline for a comprehensive article about "${article.topic}".

Keywords to include: ${keywordsString || primaryKeyword}
Focus: Current trends, latest data and insights, future projections

Generate a JSON outline with this EXACT structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaDescription": "150-160 character meta description with keyword",
  "introduction": {
    "heading": "Creative intro heading (e.g., 'Overview', 'Getting Started', 'Executive Summary', 'What You Need to Know', or topic-specific)",
    "points": ["Point 1", "Point 2", "Point 3"]
  },
  "sections": [
    {
      "heading": "Section Title",
      "subsections": ["Subsection 1", "Subsection 2"],
      "keyPoints": ["Key point 1", "Key point 2"],
      "examples": ["Example 1"]
    }
  ],
  "conclusion": {
    "heading": "Creative conclusion heading (e.g., 'Final Thoughts', 'Key Takeaways', 'Moving Forward', 'Conclusion')",
    "points": ["Key takeaway 1", "Action item 1", "Future outlook and emerging trends"]
  },
  "faqs": ["Question 1", "Question 2", "Question 3"]
}

Requirements:
- Focus on current information and latest trends
- Include latest statistics and data points
- Reference future projections and emerging developments
- CRITICAL: Avoid ANY specific year references - use "recently", "currently", "nowadays" instead
- When discussing trends, use "currently", "recently", or "in recent times"
Create EXACTLY 5-6 sections for comprehensive coverage. Return ONLY valid JSON, no explanations.`;
}

/**
 * HTML模板和规范定义
 */
const HTML_TEMPLATES = {
  categoryList: `<ul>
    <li>
        <strong>Category Title:</strong>
        <ul>
            <li>Item description</li>
            <li>Another item</li>
        </ul>
    </li>
</ul>`,
  
  comparisonList: `<ul>
    <li>
        <strong>Feature A:</strong>
        <ul>
            <li>Advantage 1</li>
            <li>Advantage 2</li>
        </ul>
    </li>
    <li>
        <strong>Feature B:</strong>
        <ul>
            <li>Different advantage</li>
        </ul>
    </li>
</ul>`,

  simpleList: `<ul>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
</ul>`
};

const CRITICAL_FORMAT_RULES = `
CRITICAL FORMATTING REQUIREMENTS - FAILURE TO FOLLOW WILL CAUSE BUILD ERRORS:

ABSOLUTELY NO BOLD OR ITALIC FORMATTING:
- NEVER use ** for bold (NOT EVEN FOR FILM TITLES OR COMPANY NAMES)
- NEVER use * for italic
- DO NOT use bold for: Film titles, Company names (Netflix, Disney+), Product names, ANY text
- Use PLAIN TEXT ONLY - no markdown formatting symbols
- For emphasis, use CAPITALIZATION or write "Notable:" or "Important:" before the text

AVOID GENERIC PLACEHOLDER NAMES:
- NEVER use generic examples like: Film A, Film B, Product X, Feature A, Company B, etc.
- Always use REAL, SPECIFIC names for movies, products, companies, and features
- Instead of "Film A", use actual movie titles
- Instead of "Product X", use actual product names
- Instead of "Feature A", describe the actual feature

USE ONLY MARKDOWN FORMAT - NO HTML TAGS:
- Use ONLY Markdown lists (with "-" or "1.")
- NEVER use HTML tags like <ul>, <li>, <ol>, <strong>, <em>
- Use exactly 2 spaces for nested list indentation

MARKDOWN TABLE FORMAT - CRITICAL:
- Tables MUST have header row, separator row, then data rows
- The separator row MUST use | --- | --- | --- | format
- EVERY table row MUST end with a newline character
- Tables MUST have blank lines before and after them

CORRECT TABLE (copy this exactly - note the separator line and blank lines):

| Column 1 | Column 2 | Column 3 |
| --- | --- | --- |
| Data 1 | Data 2 | Data 3 |
| Data 4 | Data 5 | Data 6 |

(blank line after table before next content)

WRONG TABLE (DO NOT USE - wrong separator format):
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1 | Data 2 | Data 3 |

The separator MUST use exactly | --- | --- | --- | format, not |-------|.

FORBIDDEN PATTERNS:
❌ <li>**Title:** content
❌ <li>Title: <ul><li>item</ul>
❌ **bold text** in HTML context
❌ *italic text* in HTML context

CORRECT PATTERNS:
✅ <li><strong>Title:</strong><ul><li>item</li></ul></li>
✅ <strong>bold text</strong>
✅ <em>italic text</em>
`;

/**
 * 生成文章部分的提示词
 */
function generateSectionPrompt(article, section, sectionNumber, totalSections) {
  const keywordsString = article.keywords ? article.keywords.join(', ') : '';
  const sectionHeading = section.heading || section.title || `Section ${sectionNumber}`;
  
  return `You are writing part ${sectionNumber} of ${totalSections} for an article about "${article.topic}".

Keywords to naturally include: ${keywordsString}

Section Title: ${sectionHeading}
Subsections to cover: ${section.subsections ? section.subsections.join(', ') : 'General coverage'}
${section.keyPoints ? `Key points: ${section.keyPoints.join(', ')}` : ''}
${section.examples ? `Examples to include: ${section.examples.join(', ')}` : ''}

Requirements:
- CRITICAL: NEVER use ** for bold or * for italic - use plain text only
- Write 600-800 words for this section
- Include specific examples, data, and current case studies
- Use professional, engaging tone
- Include relevant statistics and expert insights (focus on current data and recent trends)
- Add bullet points or numbered lists where appropriate
- If including a table, MUST use format: | Col1 | Col2 | on first row, then | --- | --- | separator, then data rows
- INCLUDE 2-3 external links to DIVERSE and TOPIC-RELEVANT sources
- Choose external links based on article topic:
  * Tech articles: TechCrunch.com, Wired.com, TheVerge.com, ArsTechnica.com, GitHub.com
  * Business/Finance: Bloomberg.com, Reuters.com, WSJ.com, FT.com, Economist.com
  * Entertainment: Variety.com, THR.com, RollingStone.com, Deadline.com, IndieWire.com
  * E-commerce: Shopify.com, BigCommerce.com, WooCommerce.com, Etsy.com
  * Lifestyle: Vogue.com, GQ.com, Elle.com, Esquire.com, Cosmopolitan.com
  * News/General: NPR.org, TheGuardian.com, AP.org, USAToday.com, Time.com
  * Academic/Research: Harvard.edu, MIT.edu, Stanford.edu, Nature.com, ScienceDirect.com
- VARY your source selection - don't use the same 3 sites for every article
- ALL statistics/data MUST include source citations with links
- Use keyword-rich anchor text that describes the destination (avoid "click here" or generic terms)
- Format links as: [descriptive anchor text](https://example.com)

${CRITICAL_FORMAT_RULES}

MARKDOWN EXAMPLES TO FOLLOW:

For categorized lists:
- Category Name:
  - First item in this category
  - Second item in this category
  - Third item with more detail

For comparison lists:
- Option A: Description and benefits
  - Advantage 1
  - Advantage 2
- Option B: Description and benefits
  - Advantage 1
  - Advantage 2

For external links (VARY based on topic):
According to [latest industry research from TechCrunch](https://techcrunch.com), this emerging trend represents...
Recent [market analysis from Bloomberg](https://www.bloomberg.com) indicates that...
A [recent study by MIT](https://web.mit.edu) reveals the importance of...
The [Guardian's technology section](https://www.theguardian.com/technology) reports on current developments...
[Shopify's e-commerce insights](https://www.shopify.com) show that currently...

E-E-A-T REQUIREMENTS:
- Include specific data points, statistics, and current market figures with sources
- Reference current expert opinions, latest institutional research, or newest regulatory guidelines
- Demonstrate topic expertise through technical depth and up-to-date industry insights
- Focus on current developments, emerging trends, and future projections
- IMPORTANT: Use phrases like "currently", "nowadays", "recent data shows" instead of specific dates

APPROVED AUTHORITY DOMAINS (SELECT BASED ON ARTICLE TOPIC):
Tech & Innovation: TechCrunch.com, Wired.com, TheVerge.com, ArsTechnica.com, GitHub.com, ProductHunt.com, HackerNews.com
Business & Finance: Bloomberg.com, Reuters.com, WSJ.com, FT.com, Economist.com, McKinsey.com, Deloitte.com
E-commerce & Marketing: Shopify.com, BigCommerce.com, HubSpot.com, Moz.com, NeilPatel.com, Ahrefs.com
Entertainment & Media: Variety.com, THR.com, RollingStone.com, Deadline.com, IndieWire.com, Billboard.com
Lifestyle & Fashion: Vogue.com, GQ.com, Elle.com, Esquire.com, Cosmopolitan.com, Refinery29.com
News & Current Affairs: NPR.org, TheGuardian.com, AP.org, USAToday.com, Time.com, Axios.com
Academic & Research: Harvard.edu, MIT.edu, Stanford.edu, Nature.com, ScienceDirect.com, JSTOR.org
Health & Wellness: Mayo Clinic, WebMD.com, Healthline.com, NIH.gov, WHO.int
Sports: ESPN.com, TheAthletic.com, SI.com, Bleacher Report

IMPORTANT: Mix and match sources. Each article should use different combinations of domains relevant to its topic.

IMPORTANT: Only link to homepages or well-known sections (e.g., /technology, /business, /entertainment) to avoid 404 errors. Do NOT create specific article URLs.

VALIDATION CHECKLIST - Your content MUST pass these checks:
□ NO HTML tags (<ul>, <li>, <ol>) anywhere in content
□ All lists use Markdown format (- for unordered, 1. for ordered)
□ Nested lists use exactly 2 spaces for indentation
□ Bold text uses **text** format
□ Italic text uses *text* format
□ Contains 2-3 external reference links to reliable homepage/section URLs

Generate the content for this section using MARKDOWN format. Use ## for the main heading and ### for subheadings. Use Markdown lists and formatting throughout. Do NOT use any HTML tags.`;
}

/**
 * 增强版HTML验证和修复函数
 */
function validateAndFixHtml(html) {
    console.log('🔍 Starting HTML validation and fixing...');

    // 检测是否包含Markdown格式
    const markdownIndicators = [
        /^\s*#{1,6}\s+/m,          // Markdown headings
        /\*\*[^*]+\*\*/,            // Bold markdown
        /\*[^*]+\*/,                // Italic markdown
        /^\s*[-*+]\s+/m,            // Unordered list markdown
        /^\s*\d+\.\s+/m,            // Ordered list markdown
        /\|.*\|.*\|/,               // Markdown tables
        /^\s*\|?\s*:?-+:?\s*\|/m    // Table separator lines
    ];

    const hasMarkdown = markdownIndicators.some(regex => regex.test(html));

    if (hasMarkdown) {
        console.log('📝 Markdown format detected - skipping HTML conversion');
        console.log('✅ HTML validation and fixing completed');
        return html;
    }

    // 1. 替换所有Markdown语法 - 但避免替换HTML标签内的内容
    // 先保护HTML标签
    const htmlTags = [];
    let protectedHtml = html.replace(/<[^>]+>/g, (match) => {
        htmlTags.push(match);
        return `__HTMLTAG${htmlTags.length - 1}HTMLTAG__`;
    });

    // 替换Markdown语法
    protectedHtml = protectedHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    protectedHtml = protectedHtml.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 恢复HTML标签 - 在替换下划线Markdown之前恢复，避免被再次处理
    html = protectedHtml.replace(/__HTMLTAG(\d+)HTMLTAG__/g, (match, index) => {
        return htmlTags[parseInt(index)];
    });

    // 2. 移除Markdown列表标记
    html = html.replace(/^\s*[-*+]\s+/gm, '');
    html = html.replace(/^\s*\d+\.\s+/gm, '');
    
    // 3. 修复以冒号结尾的li标签
    html = html.replace(/<li>([^<]*?):\s*\n/g, '<li>\n    <strong>$1:</strong>\n');
    
    // 4. 确保所有以冒号结尾的li标签有正确的嵌套结构
    html = html.replace(/<li>([^<]*?:)\s*\n\s*(<ul>[\s\S]*?<\/ul>)(?!\s*<\/li>)/g, 
                       '<li>\n    <strong>$1</strong>\n    $2\n</li>');
    html = html.replace(/<li>([^<]*?:)\s*\n\s*(<ol>[\s\S]*?<\/ol>)(?!\s*<\/li>)/g, 
                       '<li>\n    <strong>$1</strong>\n    $2\n</li>');
    
    // 5. 移除特殊字符和清理
    html = html.replace(/\^\s*\n/g, '');
    html = html.replace(/\`\s*\n/g, '');
    html = html.replace(/\~\s*\n/g, '');
    
    // 6. 移除空的列表项
    html = html.replace(/<li>\s*<\/li>/gi, '');
    html = html.replace(/<ol><li>\s*<\/li>/gi, '<ol>');
    html = html.replace(/<ul><li>\s*<\/li>/gi, '<ul>');
    
    // 7. 高级标签匹配验证
    const openLi = (html.match(/<li>/g) || []).length;
    const closeLi = (html.match(/<\/li>/g) || []).length;
    
    if (openLi !== closeLi) {
        console.warn(`⚠️  HTML validation warning: ${openLi} <li> tags but ${closeLi} </li> tags`);
        
        // 尝试自动修复不匹配的标签
        if (openLi > closeLi) {
            const missing = openLi - closeLi;
            for (let i = 0; i < missing; i++) {
                html += '\n</li>';
            }
            console.log(`✅ Auto-fixed ${missing} missing </li> tags`);
        }
    }
    
    // 8. 验证嵌套结构
    const nestingIssues = validateNestingStructure(html);
    if (nestingIssues.length > 0) {
        console.warn('⚠️  Nesting structure issues found:', nestingIssues);
    }
    
    // 9. 最终清理
    html = html.replace(/\n{3,}/g, '\n\n');
    html = html.replace(/^\s*<\/li>\s*$/gm, '');
    
    console.log('✅ HTML validation and fixing completed');
    return html;
}

/**
 * 修复外部链接，确保使用安全的URL
 */
function fixExternalLinks(html) {
    console.log('🔗 Fixing external links to prevent 404 errors...');

    // 检测是否包含Markdown格式 - 如果是markdown，跳过处理
    const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/;
    if (markdownLinkPattern.test(html)) {
        console.log('📝 Markdown links detected - skipping link fixing');
        console.log('✅ External links fixed');
        return html;
    }

    // 定义安全的域名和其默认路径
    const safeUrlMappings = {
        // News sites
        'forbes.com': 'https://www.forbes.com',
        'bbc.com': 'https://www.bbc.com',
        'cnn.com': 'https://www.cnn.com',
        'reuters.com': 'https://www.reuters.com',
        'bloomberg.com': 'https://www.bloomberg.com',
        'techcrunch.com': 'https://techcrunch.com',
        'wired.com': 'https://www.wired.com',
        'theverge.com': 'https://www.theverge.com',
        'arstechnica.com': 'https://arstechnica.com',
        'businessinsider.com': 'https://www.businessinsider.com',
        'cnbc.com': 'https://www.cnbc.com',
        'marketwatch.com': 'https://www.marketwatch.com',
        'vogue.com': 'https://www.vogue.com',
        'gq.com': 'https://www.gq.com',
        'rollingstone.com': 'https://www.rollingstone.com',
        'variety.com': 'https://variety.com',
        'wikipedia.org': 'https://en.wikipedia.org/wiki/Main_Page',
        // Government sites - use main pages
        'sec.gov': 'https://www.sec.gov',
        'treasury.gov': 'https://www.treasury.gov',
        // Educational sites - use main pages
        'mit.edu': 'https://www.mit.edu',
        'harvard.edu': 'https://www.harvard.edu',
        'stanford.edu': 'https://www.stanford.edu'
    };
    
    // Fix href attributes in anchor tags
    html = html.replace(/href="https?:\/\/([^"\/]+)([^"]*?)"/gi, (match, domain, path) => {
        // Check if the URL contains a specific article path that might 404
        const hasSpecificPath = path && path.length > 1 && 
                               (path.includes('/article') || 
                                path.includes('/report') || 
                                path.includes('/study') ||
                                path.includes('/example') ||
                                path.includes('/specific') ||
                                path.match(/\/20\d{2}\//));  // Filter out any year-specific paths
        
        // Find matching safe domain
        for (const [safeDomain, safeUrl] of Object.entries(safeUrlMappings)) {
            if (domain.includes(safeDomain)) {
                if (hasSpecificPath) {
                    // Replace with safe homepage URL
                    console.log(`  Fixed: ${domain}${path} -> ${safeUrl}`);
                    return `href="${safeUrl}"`;
                }
                break;
            }
        }
        
        return match; // Keep original if it looks safe
    });
    
    // Fix Markdown-style links (in case any remain)
    html = html.replace(/\[([^\]]+)\]\(https?:\/\/([^)\/]+)([^)]*?)\)/gi, (match, text, domain, path) => {
        const hasSpecificPath = path && path.length > 1 && 
                               (path.includes('/article') || 
                                path.includes('/report') || 
                                path.includes('/study') ||
                                path.includes('/example'));
        
        for (const [safeDomain, safeUrl] of Object.entries(safeUrlMappings)) {
            if (domain.includes(safeDomain)) {
                if (hasSpecificPath) {
                    console.log(`  Fixed Markdown link: ${domain}${path} -> ${safeUrl}`);
                    return `<a href="${safeUrl}" target="_blank" rel="nofollow">${text}</a>`;
                }
                break;
            }
        }
        
        // Convert to HTML link if it's still in Markdown format
        return `<a href="https://${domain}${path}" target="_blank" rel="nofollow">${text}</a>`;
    });
    
    console.log('✅ External links fixed');
    return html;
}

/**
 * 验证HTML嵌套结构
 */
function validateNestingStructure(html) {
    const issues = [];
    const lines = html.split('\n');
    const stack = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 检查开始标签
        const openTags = line.match(/<(li|ul|ol)>/g);
        if (openTags) {
            openTags.forEach(tag => {
                stack.push({ tag: tag.replace(/[<>]/g, ''), line: i + 1 });
            });
        }
        
        // 检查结束标签
        const closeTags = line.match(/<\/(li|ul|ol)>/g);
        if (closeTags) {
            closeTags.forEach(tag => {
                const tagName = tag.replace(/[</>]/g, '');
                if (stack.length === 0) {
                    issues.push(`Unexpected closing tag ${tag} at line ${i + 1}`);
                } else {
                    const lastOpen = stack.pop();
                    if (lastOpen.tag !== tagName) {
                        issues.push(`Mismatched tags: opened ${lastOpen.tag} at line ${lastOpen.line}, closed ${tagName} at line ${i + 1}`);
                    }
                }
            });
        }
    }
    
    // 检查未闭合的标签
    if (stack.length > 0) {
        stack.forEach(unclosed => {
            issues.push(`Unclosed tag ${unclosed.tag} at line ${unclosed.line}`);
        });
    }
    
    return issues;
}

/**
 * 最终HTML验证
 */
function finalHtmlValidation(htmlContent) {
    const issues = [];
    
    // 确保htmlContent是字符串
    if (typeof htmlContent !== 'string') {
        return ['Invalid HTML content type'];
    }
    
    // 检查未闭合的li标签
    const liMatches = htmlContent.match(/<li>(?![^<]*<\/li>)[^<]*$/gm);
    if (liMatches) {
        issues.push(`Unclosed <li> tags found: ${liMatches.length}`);
    }
    
    // 检查Markdown语法残留
    const markdownMatches = htmlContent.match(/\*\*[^*]+\*\*|\*[^*]+\*/g);
    if (markdownMatches) {
        issues.push(`Markdown syntax found in HTML: ${markdownMatches.slice(0,3).join(', ')}`);
    }
    
    // 检查特殊字符
    const specialChars = htmlContent.match(/\^|\`|\~/g);
    if (specialChars) {
        issues.push(`Special characters found: ${specialChars.slice(0,3).join(', ')}`);
    }
    
    // 检查空标签
    const emptyTags = htmlContent.match(/<(li|ul|ol)>\s*<\/\1>/g);
    if (emptyTags) {
        issues.push(`Empty tags found: ${emptyTags.slice(0,3).join(', ')}`);
    }
    
    if (issues.length > 0) {
        console.error('❌ Final HTML validation failed:', issues);
        return false;
    }
    
    console.log('✅ Final HTML validation passed');
    return true;
}

// 保持向后兼容性
function fixHtmlTags(html) {
    // 先修复HTML标签问题
    html = validateAndFixHtml(html);
    // 再修复外部链接
    html = fixExternalLinks(html);
    return html;
}


/**
 * 带超时的API调用包装器
 */
async function callWithTimeout(apiCall, timeoutMs = 60000, description = 'API call') {
  return Promise.race([
    apiCall,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${description} timeout after ${timeoutMs/1000}s`)), timeoutMs)
    )
  ]);
}

/**
 * 带重试的API调用
 */
async function callWithRetry(apiCall, maxRetries = 2, description = 'API call') {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callWithTimeout(apiCall, 60000, description);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      log(`     🔄 Retrying ${description} (attempt ${attempt + 1}/${maxRetries})...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

/**
 * 生成比较表格
 */
function generateComparisonTable(topic) {
  return `
<table border="1">
<tr>
<th>Aspect</th>
<th>Traditional Approach</th>
<th>Modern ${topic} Approach</th>
<th>Key Differences</th>
</tr>
<tr>
<td>Accessibility</td>
<td>Limited to accredited investors</td>
<td>Open to broader audience</td>
<td>Democratized access</td>
</tr>
<tr>
<td>Minimum Investment</td>
<td>High barriers ($100k+)</td>
<td>Low barriers ($100+)</td>
<td>1000x reduction</td>
</tr>
<tr>
<td>Liquidity</td>
<td>Lock-up periods</td>
<td>24/7 trading possible</td>
<td>Instant liquidity</td>
</tr>
<tr>
<td>Transaction Speed</td>
<td>Days to weeks</td>
<td>Minutes to hours</td>
<td>100x faster</td>
</tr>
</table>

`;
}

/**
 * 图片缓存管理
 */
const IMAGE_CACHE_DIR = path.join(__dirname, '../.image-cache');
const CACHE_INDEX_FILE = path.join(IMAGE_CACHE_DIR, 'image-cache.json');

// 确保缓存目录存在
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

// 加载缓存索引
function loadImageCache() {
  try {
    if (fs.existsSync(CACHE_INDEX_FILE)) {
      const cacheData = fs.readFileSync(CACHE_INDEX_FILE, 'utf-8');
      return JSON.parse(cacheData);
    }
  } catch (error) {
    console.warn('Failed to load image cache:', error.message);
  }
  return {};
}

// 保存缓存索引
function saveImageCache(cache) {
  try {
    fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Failed to save image cache:', error.message);
  }
}

// 生成缓存键
function generateCacheKey(prompt) {
  return crypto.createHash('md5').update(prompt).digest('hex');
}

// 检查缓存是否有效（1.5小时内，因为DALL-E URL 2小时过期）
function isCacheValid(cacheEntry) {
  if (!cacheEntry || !cacheEntry.timestamp) return false;
  const ageInHours = (Date.now() - cacheEntry.timestamp) / (1000 * 60 * 60);
  // DALL-E URLs expire after 2 hours, so we use 1.5 hours to be safe
  return ageInHours < 1.5;
}

/**
 * 根据主题获取定制化的图片提示词
 */
function getThemedImagePrompts(topic, keywords) {
  const topicLower = topic.toLowerCase();
  
  // 房地产相关主题
  if (topicLower.includes('real estate') || topicLower.includes('property')) {
    return [
      {
        name: "Hero Image",
        prompt: `Modern real estate investment visualization for ${topic}. 
          Show: luxury properties, digital overlay showing tokenization, blockchain network connections.
          Elements: skyscrapers, residential buildings, smart contracts floating around buildings.
          Style: professional real estate marketing, blue and gold color scheme, photorealistic with digital elements`
      },
      {
        name: "Process Illustration",
        prompt: `Real estate tokenization process flowchart. 
          Show: property evaluation → legal structuring → token creation → investor distribution.
          Include: property icons, legal documents, blockchain symbols, investor avatars.
          Style: clean infographic, professional real estate colors, step-by-step visual guide`
      },
      {
        name: "Benefits Visualization",
        prompt: `Benefits of tokenized real estate investment. 
          Show: fractional ownership pie charts, global accessibility map, 24/7 trading clock, liquidity waves.
          Include: ${keywords.join(', ')} visual representations.
          Style: modern real estate presentation, data visualization, professional and trustworthy`
      },
      {
        name: "Summary Graphic",
        prompt: `Future of real estate tokenization vision. 
          Show: futuristic city skyline with blockchain networks, global connectivity, digital transformation.
          Style: forward-looking real estate technology, inspiring and professional`
      }
    ];
  }
  
  // DeFi和金融相关主题
  if (topicLower.includes('defi') || topicLower.includes('finance') || topicLower.includes('lending')) {
    return [
      {
        name: "Hero Image",
        prompt: `DeFi and financial technology illustration for ${topic}. 
          Show: interconnected financial networks, smart contract nodes, yield farming visualizations.
          Elements: cryptocurrency symbols, lending pools, liquidity graphs, ${keywords[0]} concepts.
          Style: modern fintech aesthetic, purple and cyan gradients, clean and professional`
      },
      {
        name: "Process Illustration",
        prompt: `DeFi protocol workflow diagram for ${topic}. 
          Show: user wallet → smart contract → liquidity pool → yield generation flow.
          Include: ${keywords.slice(0, 2).join(' and ')} mechanisms.
          Style: technical but accessible, modern DeFi colors, clear process visualization`
      },
      {
        name: "Benefits Visualization",
        prompt: `DeFi advantages and returns visualization. 
          Show: APY percentages, compound interest graphs, risk-reward matrices.
          Focus on: ${keywords.join(', ')} benefits.
          Style: professional financial dashboard, data-driven design, trustworthy appearance`
      },
      {
        name: "Summary Graphic",
        prompt: `Future of decentralized finance ecosystem. 
          Show: integrated DeFi protocols, traditional finance bridge, global accessibility.
          Style: futuristic finance visualization, innovative and professional`
      }
    ];
  }
  
  // NFT和艺术相关主题
  if (topicLower.includes('nft') || topicLower.includes('art') || topicLower.includes('collectibles')) {
    return [
      {
        name: "Hero Image",
        prompt: `Digital art and NFT marketplace visualization for ${topic}. 
          Show: art gallery transitioning to digital space, NFT frames, blockchain certificates.
          Elements: famous artworks becoming tokenized, ${keywords[0]} representation.
          Style: artistic yet professional, vibrant colors, creative and modern`
      },
      {
        name: "Process Illustration",
        prompt: `NFT creation and trading process for ${topic}. 
          Show: artist creation → minting → marketplace listing → collector purchase.
          Include: ${keywords.slice(0, 2).join(' and ')} elements.
          Style: creative infographic, art market aesthetics, clear workflow`
      },
      {
        name: "Benefits Visualization",
        prompt: `Benefits of tokenized art investment. 
          Show: fractional art ownership, global art market access, authenticity verification.
          Focus: ${keywords.join(', ')} advantages.
          Style: sophisticated art investment presentation, elegant and professional`
      },
      {
        name: "Summary Graphic",
        prompt: `Future of digital art and collectibles market. 
          Show: virtual galleries, metaverse integration, global art democratization.
          Style: visionary art technology, inspiring and creative`
      }
    ];
  }
  
  // 证券和合规相关主题
  if (topicLower.includes('security') || topicLower.includes('compliance') || topicLower.includes('regulation')) {
    return [
      {
        name: "Hero Image",
        prompt: `Security and compliance visualization for ${topic}. 
          Show: security shields, regulatory frameworks, compliance checkmarks, KYC/AML processes.
          Elements: ${keywords.slice(0, 2).join(' and ')} symbols.
          Style: professional legal/compliance aesthetic, blue and green trust colors, authoritative`
      },
      {
        name: "Process Illustration",
        prompt: `Compliance workflow diagram for ${topic}. 
          Show: KYC verification → regulatory approval → token issuance → ongoing compliance.
          Include: ${keywords[0]} and ${keywords[1]} requirements.
          Style: clean legal infographic, professional and clear, structured layout`
      },
      {
        name: "Benefits Visualization",
        prompt: `Benefits of regulatory compliance in tokenization. 
          Show: investor protection shields, transparent processes, audit trails.
          Focus: ${keywords.join(', ')} advantages.
          Style: trustworthy compliance presentation, professional legal colors`
      },
      {
        name: "Summary Graphic",
        prompt: `Future of regulated digital assets. 
          Show: global regulatory harmony, secure digital infrastructure, compliant innovation.
          Style: forward-looking regulatory vision, professional and reassuring`
      }
    ];
  }
  
  // 默认通用模板
  return [
    {
      name: "Hero Image",
      prompt: `Professional hero image for article about ${topic}. 
        Key concepts: ${keywords.slice(0, 3).join(', ')}. 
        Style: modern business illustration, clean corporate design, vibrant colors, high quality, 
        visual metaphors representing ${topic}, professional and engaging`
    },
    {
      name: "Process Illustration",
      prompt: `Detailed process diagram or flowchart showing how ${topic} works. 
        Include: ${keywords[0]} and ${keywords[1]} concepts. 
        Style: clean infographic design, professional business illustration, 
        educational and clear, modern tech aesthetic`
    },
    {
      name: "Benefits Visualization",
      prompt: `Visual representation of benefits and advantages of ${topic}. 
        Focus on: positive outcomes, growth, success metrics related to ${keywords.join(', ')}. 
        Style: optimistic business illustration, data visualization elements, 
        modern corporate design, engaging and informative`
    },
    {
      name: "Summary Graphic",
      prompt: `Comprehensive summary illustration for ${topic} article conclusion. 
        Combine key elements: ${keywords.slice(0, 2).join(' and ')}. 
        Style: professional closing graphic, modern business aesthetic, 
        forward-looking design, inspiring and memorable`
    }
  ];
}

/**
 * 下载图片到本地
 */
async function downloadImage(url, filepath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await downloadImageAttempt(url, filepath);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      log(`      ⚠️  Download attempt ${attempt} failed, retrying in ${attempt}s...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function downloadImageAttempt(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      timeout: 30000,  // 30秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          // Recursively follow the redirect
          downloadImageAttempt(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
      
      response.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(err);
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
    
    request.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * 统一的 slugify 函数（与 add-articles-improved.js 保持一致）
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * 保存图片（下载并存储到本地）
 */
async function saveArticleImages(images, articleSlug) {
  // 如果是临时slug（以temp-开头），使用临时目录
  const isTemp = articleSlug.startsWith('temp-');
  const imageDir = isTemp 
    ? path.join(__dirname, '../temp-images', articleSlug)
    : path.join(__dirname, '../src/assets/images/articles', articleSlug);
  
  // 确保目录存在
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  const savedImages = [];
  const imageNames = ['cover.png', 'img_0.jpg', 'img_1.jpg', 'img_2.jpg'];
  
  // 串行下载图片，每个之间间隔500ms，提高成功率
  for (let i = 0; i < images.length && i < imageNames.length; i++) {
    const imageUrl = images[i];
    const imagePath = path.join(imageDir, imageNames[i]);
    
    // 跳过已存在的本地图片
    if (imageUrl.startsWith('local://already-exists/')) {
      log(`      ✅ Skipping ${imageNames[i]} - already exists locally`, 'green');
      savedImages.push(imagePath);
      continue;
    }
    
    // 在下载之间添加延迟，避免请求过快
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    try {
      // 如果是DALL-E URL，下载它
      if (imageUrl.includes('oaidalleapi')) {
        await downloadImage(imageUrl, imagePath, 3); // 3次重试
        log(`      📥 Downloaded ${imageNames[i]}`, 'green');
      } else {
        // 否则创建占位符（包括placeholder://和其他情况）
        log(`      📄 Creating placeholder for ${imageNames[i]}`, 'yellow');
        fs.writeFileSync(imagePath, 'placeholder image');
      }
      savedImages.push(imagePath);
    } catch (error) {
      log(`      ❌ Failed to download ${imageNames[i]} after 3 attempts: ${error.message}`, 'red');
      // 创建占位符文件
      fs.writeFileSync(imagePath, 'placeholder image');
      savedImages.push(imagePath);
    }
  }
  
  return savedImages;
}

/**
 * 生成图片并保存
 */
/**
 * 全AI方案生成图片：所有图片都通过DALL-E生成，带缓存机制和主题特定模板
 */
async function generateHybridImages(openai, topic, keywords) {
  const images = [];
  const cache = loadImageCache();
  
  // 根据主题选择专门的提示词模板
  const imagePrompts = getThemedImagePrompts(topic, keywords);
  
  // 检查本地是否已经有图片（从之前的运行中保存的）
  // 注意：这里暂时使用 topic 的 slug，可能与最终的不同
  const tempArticleSlug = slugify(topic);
  const imageDir = path.join(__dirname, '../src/assets/images/articles', tempArticleSlug);
  const imageNames = ['cover.png', 'img_0.jpg', 'img_1.jpg', 'img_2.jpg'];
  
  // 生成所有图片（检查本地文件和缓存后生成）
  for (let i = 0; i < imagePrompts.length; i++) {
    // 在生成图片之间添加延迟，避免API压力过大
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 每张图片间隔1秒
    }
    
    // 首先检查本地是否已有图片
    const localImagePath = path.join(imageDir, imageNames[i]);
    if (fs.existsSync(localImagePath)) {
      const stats = fs.statSync(localImagePath);
      if (stats.size > 1024) { // 大于1KB认为是有效图片
        log(`    📁 Using existing local image ${i + 1}/4: ${imageNames[i]} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`, 'green');
        // 使用一个占位URL，因为本地文件已经存在
        images.push(`local://already-exists/${imageNames[i]}`);
        continue;
      }
    }
    
    const cacheKey = generateCacheKey(imagePrompts[i].prompt);
    const cachedImage = cache[cacheKey];
    
    // 跳过URL缓存，因为DALL-E URLs会在2小时后过期
    // 只依赖本地文件检查
    /*
    if (cachedImage && isCacheValid(cachedImage)) {
      log(`    💾 Using cached image ${i + 1}/4: ${imagePrompts[i].name}`, 'cyan');
      images.push(cachedImage.url);
      continue;
    }
    */
    
    // 否则生成新图片
    try {
      log(`    🎨 Generating AI image ${i + 1}/4: ${imagePrompts[i].name}...`, 'blue');
      
      const imageResponse = await Promise.race([
        openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompts[i].prompt,
          size: "1792x1024",  // 横向 16:9 比例，更适合文章配图
          quality: "standard",
          n: 1,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DALL-E timeout after 120s')), 120000))
      ]);
      
      const imageUrl = imageResponse.data[0].url;
      images.push(imageUrl);
      
      // 保存到缓存（不保存URL，只记录生成信息）
      cache[cacheKey] = {
        generated: true,  // 标记为已生成
        localPath: `${tempArticleSlug}/${imageNames[i]}`, // 记录相对路径
        prompt: imagePrompts[i].prompt,
        timestamp: Date.now(),
        topic: topic,
        name: imagePrompts[i].name
      };
      
      log(`    ✅ ${imagePrompts[i].name} generated and cached successfully`, 'green');
    } catch (error) {
      log(`    ❌ ${imagePrompts[i].name} failed (${error.message})`, 'red');
      // 不使用Unsplash，而是标记为失败，后续会创建占位符
      images.push(`placeholder://${imagePrompts[i].name}`);
    }
  }
  
  // 保存更新后的缓存
  saveImageCache(cache);
  
  const aiGeneratedCount = images.filter(url => url.includes('oaidalleapi')).length;
  const placeholderCount = images.filter(url => url.startsWith('placeholder://')).length;
  log(`    🖼️  All images prepared (${aiGeneratedCount} AI-generated, ${placeholderCount} failed)`, aiGeneratedCount === 4 ? 'green' : 'yellow');
  return images;
}

/**
 * 根据文章主题和关键词生成图片主题
 */
function getImageThemes(topic, keywords) {
  const themes = [];
  
  // 根据主题选择相关的图片关键词
  if (topic.toLowerCase().includes('real estate') || topic.toLowerCase().includes('property')) {
    themes.push('real-estate,modern-building', 'property-investment,architecture', 'commercial-property,skyline');
  } else if (topic.toLowerCase().includes('tokenization') || topic.toLowerCase().includes('token')) {
    themes.push('blockchain,digital', 'cryptocurrency,technology', 'fintech,innovation');
  } else if (topic.toLowerCase().includes('defi') || topic.toLowerCase().includes('finance')) {
    themes.push('finance,technology', 'investment,digital', 'trading,chart');
  } else if (topic.toLowerCase().includes('nft') || topic.toLowerCase().includes('art')) {
    themes.push('digital-art,nft', 'art-gallery,modern', 'creative,technology');
  } else if (topic.toLowerCase().includes('security') || topic.toLowerCase().includes('compliance')) {
    themes.push('security,technology', 'compliance,business', 'data-protection,cyber');
  } else {
    // 默认使用关键词
    keywords.slice(0, 3).forEach(keyword => {
      themes.push(`${keyword},business`);
    });
  }
  
  return themes;
}

/**
 * 备用方案：使用主题相关的占位图片
 */
function generateTopicImages(topic, keywords) {
  const images = [];
  
  // 生成4张备用图片URL
  for (let i = 0; i < 4; i++) {
    const keyword = keywords[i % keywords.length] || topic.split(' ')[0];
    images.push(`https://source.unsplash.com/1024x576/?${keyword},business&sig=${Date.now() + i}`);
  }
  
  return images;
}

/**
 * 生成文章HTML
 */
async function generateArticleHTML(openai, article, index, totalCount) {
  const startTime = Date.now();
  
  try {
    log(`  📝 [${index + 1}/${totalCount}] Starting article generation: ${article.topic}`, 'cyan');
    
    // 生成混合图片（AI主图 + Unsplash图片）
    const images = await generateHybridImages(openai, article.topic, article.keywords);
    
    // Debug: 输出实际生成的图片URLs
    console.log(`\n    🔍 Debug - Generated images for "${article.topic}":`);
    images.forEach((url, i) => {
      const source = url.includes('oaidalleapi') ? 'DALL-E' : url.includes('unsplash') ? 'Unsplash' : 'Unknown';
      console.log(`       ${i + 1}. [${source}] ${url.substring(0, 80)}...`);
    });
    
    // 使用唯一的临时文件夹名，避免和最终文件夹冲突
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const tempArticleSlug = `temp-${timestamp}-${randomSuffix}`;
    
    // 立即下载图片，避免OpenAI URL过期（2小时时效）
    log(`     📥 Downloading images immediately to prevent URL expiration...`, 'blue');
    const tempSavedImages = await saveArticleImages(images, tempArticleSlug);
    // Step 1: 生成文章大纲
    log(`     📋 Generating outline...`, 'blue');
    const outlineResponse = await callWithRetry(
      openai.chat.completions.create({
        model: DEFAULT_CONFIG.model,
        messages: [{
          role: "user",
          content: generateArticleOutline(article)
        }],
        temperature: 0.7,
        max_tokens: 1000  // 适中的token限制
      }),
      2,
      'outline generation'
    );
    
    let outline;
    try {
      const outlineText = outlineResponse.choices[0].message.content;
      // 尝试解析JSON，如果失败则创建默认大纲
      outline = JSON.parse(outlineText.replace(/```json\n?|```/g, ''));
    } catch (e) {
      // 如果解析失败，创建默认大纲
      outline = {
        title: article.topic,
        metaDescription: `Comprehensive guide to ${article.topic} with expert insights and practical advice`,
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
        faqs: Array(10).fill(null).map((_, i) => `Question ${i + 1} about ${article.topic}`)
      };
    }
    
    // Step 2: 生成各个部分
    let fullContent = '';
    
    // 生成标题和元描述
    const articleTitle = outline.title || article.topic;
    const metaDesc = outline.metaDescription || `Comprehensive guide to ${article.topic} with expert insights and practical advice`;
    fullContent += `<h1>${articleTitle}</h1>\n`;
    fullContent += `<p><em>Meta description:</em> ${metaDesc}</p>\n\n`;
    
    // 生成引言
    log(`     ✍️  Generating introduction...`, 'blue');
    const introHeading = outline.introduction?.heading || 'Introduction';
    const introPrompt = `Write a compelling 400-500 word introduction for an article about "${article.topic}".
Include: ${JSON.stringify(outline.introduction)}
Keywords: ${article.keywords?.join(', ') || ''}

Requirements:
- Start with a hook or surprising fact using "recent data" without specific years
- Provide overview of what will be covered
- Include primary keywords naturally
- Professional, engaging tone focused on current trends
- AVOID mentioning any specific years - use "recently", "in recent times", or "currently" instead
- INCLUDE 1-2 external links to DIVERSE sources relevant to the topic
- Select sources that match the article theme:
  * Don't always use BBC, CNN, Forbes - vary your sources
  * Choose domain-specific authorities (e.g., TechCrunch for tech, Variety for entertainment)
  * Mix mainstream and specialized sources
- Use descriptive anchor text that includes relevant keywords
- Format links as: <a href="https://example.com" target="_blank" rel="nofollow">descriptive anchor text</a>

IMPORTANT HTML Rules:
- ALWAYS properly close ALL HTML tags
- For lists, ensure every <li> tag is properly closed with </li>
- Never mix markdown with HTML - use pure HTML only
- External links must use target="_blank" rel="nofollow" for SEO best practices

Example link formats (VARY these based on topic):
For tech: According to <a href="https://techcrunch.com" target="_blank" rel="nofollow">TechCrunch's latest analysis</a>, the market is evolving...
For business: The <a href="https://www.bloomberg.com" target="_blank" rel="nofollow">Bloomberg's recent report</a> shows that...
For e-commerce: <a href="https://www.shopify.com" target="_blank" rel="nofollow">Shopify's current e-commerce trends</a> indicate...
For entertainment: <a href="https://variety.com" target="_blank" rel="nofollow">Variety's industry coverage</a> reveals this year...
For research: A <a href="https://www.nature.com" target="_blank" rel="nofollow">recent Nature study</a> demonstrates...

E-E-A-T REQUIREMENTS:
- Start with a compelling current statistic or recent expert insight with source
- Establish credibility early with current authoritative references
- Show expertise through up-to-date industry-specific terminology
- Reference recent events (without specific dates), latest developments, and future projections

Return ONLY the HTML content starting with <h2>${introHeading}</h2>. Do NOT include markdown code blocks or backticks.`;
    
    const introResponse = await callWithRetry(
      openai.chat.completions.create({
        model: DEFAULT_CONFIG.model,
        messages: [{ role: "user", content: introPrompt }],
        temperature: 0.7,
        max_tokens: 1000  // 引言适中长度
      }),
      2,
      'introduction generation'
    );
    // 清理引言内容
    let introContent = introResponse.choices[0].message.content;
    introContent = introContent.replace(/^```html\n?/g, '').replace(/\n?```$/g, '');
    introContent = fixHtmlTags(introContent);  // 修复HTML标签
    fullContent += introContent + '\n\n';
    
    // 插入第一张图片
    fullContent += `<img src="${images[0]}" alt="${article.topic}" />\n\n`;
    
    // 生成主要章节
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      const sectionTitle = section.heading || section.title || `Section ${i + 1}`;
      log(`     ✍️  Generating section ${i + 1}/${outline.sections.length}: ${sectionTitle}...`, 'blue');
      
      const sectionResponse = await callWithRetry(
        openai.chat.completions.create({
          model: DEFAULT_CONFIG.model,
          messages: [{
            role: "user",
            content: generateSectionPrompt(article, section, i + 1, outline.sections.length)
          }],
          temperature: 0.7,
          max_tokens: 1500  // 每节适中长度
        }),
        2,
        `section ${i + 1} generation`
      );
      
      // 清理生成的内容，去除可能的markdown代码块标记
      let sectionContent = sectionResponse.choices[0].message.content;
      sectionContent = sectionContent.replace(/^```html\n?/g, '').replace(/\n?```$/g, '');
      sectionContent = fixHtmlTags(sectionContent);  // 修复HTML标签
      fullContent += sectionContent + '\n\n';
      
      // 在第2、4节后插入图片
      if (i === 1) fullContent += `<img src="${images[1]}" alt="${sectionTitle}" />\n\n`;
      if (i === 3 && images.length > 2) fullContent += `<img src="${images[2]}" alt="${sectionTitle}" />\n\n`;
      
      // 在第3节后添加比较表格 - DISABLED: Not relevant for most articles
      // if (i === 2) {
      //   fullContent += generateComparisonTable(article.topic);
      // }
    }
    
    // 插入最后一张图片
    fullContent += `<img src="${images[3]}" alt="${article.topic} Summary" />\n\n`;
    
    // 生成结论
    log(`     ✍️  Generating conclusion...`, 'blue');
    const conclusionHeading = outline.conclusion?.heading || 'Conclusion';
    const conclusionPrompt = `Write a comprehensive 400-500 word conclusion for an article about "${article.topic}".
Key points to cover: ${JSON.stringify(outline.conclusion)}

Requirements:
- Summarize main insights from a current perspective
- Provide actionable takeaways for the present time
- Future outlook focusing on emerging trends and beyond
- Use "currently", "nowadays", or "at present" instead of referencing specific years
- Call to action
- INCLUDE 1-2 external links to DIVERSE sources relevant to the topic
- Choose different sources than used in introduction and body
- Vary sources: don't always use the same sites
- Anchor text should be descriptive and keyword-relevant
- Format links as: <a href="https://example.com" target="_blank" rel="nofollow">descriptive anchor text</a>

IMPORTANT HTML Rules:
- ALWAYS properly close ALL HTML tags
- For lists, ensure every <li> tag is properly closed with </li>
- Never mix markdown with HTML - use pure HTML only
- External links must use target="_blank" rel="nofollow" for SEO best practices

Example variations based on topic:
Tech: The <a href="https://www.theverge.com" target="_blank" rel="nofollow">The Verge's latest tech predictions</a> suggest...
Business: <a href="https://www.economist.com" target="_blank" rel="nofollow">The Economist's analysis</a> forecasts...
E-commerce: According to <a href="https://www.bigcommerce.com" target="_blank" rel="nofollow">BigCommerce's market insights</a>...
Entertainment: <a href="https://www.hollywoodreporter.com" target="_blank" rel="nofollow">The Hollywood Reporter</a> predicts...
According to <a href="https://www.reuters.com" target="_blank" rel="nofollow">Reuters coverage</a>, the future looks...

E-E-A-T REQUIREMENTS:
- Reference future trends with authoritative sources
- Include actionable insights based on expert recommendations
- Demonstrate thought leadership through forward-looking analysis

Return ONLY the HTML content starting with <h2>${conclusionHeading}</h2>. Do NOT include markdown code blocks or backticks.`;
    
    const conclusionResponse = await callWithRetry(
      openai.chat.completions.create({
        model: DEFAULT_CONFIG.model,
        messages: [{ role: "user", content: conclusionPrompt }],
        temperature: 0.7,
        max_tokens: 1000  // 引言适中长度
      }),
      2,
      'conclusion generation'
    );
    // 清理结论内容
    let conclusionContent = conclusionResponse.choices[0].message.content;
    conclusionContent = conclusionContent.replace(/^```html\n?/g, '').replace(/\n?```$/g, '');
    conclusionContent = fixHtmlTags(conclusionContent);  // 修复HTML标签
    fullContent += conclusionContent + '\n\n';
    
    // 生成FAQ
    log(`     ✍️  Generating FAQs...`, 'blue');
    const faqPrompt = `Generate 8-10 comprehensive FAQs about "${article.topic}".
Questions to cover: ${JSON.stringify(outline.faqs)}

Requirements:
- Each answer should be 80-100 words
- Use schema.org FAQ format
- Cover common questions and concerns
- Include keywords naturally

Return ONLY the HTML content using this format:
<section itemscope itemprop="mainEntity" itemtype="https://schema.org/FAQPage">
<h2>Frequently Asked Questions</h2>
[FAQ items here]
</section>

IMPORTANT HTML Rules:
- ALWAYS properly close ALL HTML tags
- Never mix markdown with HTML - use pure HTML only
- Each FAQ must be properly structured with closed div tags

Do NOT include markdown code blocks or backticks.`;
    
    const faqResponse = await callWithRetry(
      openai.chat.completions.create({
        model: DEFAULT_CONFIG.model,
        messages: [{ role: "user", content: faqPrompt }],
        temperature: 0.7,
        max_tokens: 1800  // FAQ适中长度
      }),
      2,
      'FAQ generation'
    );
    // 清理FAQ内容
    let faqContent = faqResponse.choices[0].message.content;
    faqContent = faqContent.replace(/^```html\n?/g, '').replace(/\n?```$/g, '');
    faqContent = fixHtmlTags(faqContent);  // 修复HTML标签
    fullContent += faqContent;
    
    let content = fullContent;
    
    // 额外清理所有可能的代码块标记
    content = content.replace(/```html\n?/g, '').replace(/\n?```/g, '');
    
    // 最终修复所有HTML标签问题
    content = fixHtmlTags(content);

    // 强制移除所有markdown格式
    content = content.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold **text**
    content = content.replace(/\*([^*\s][^*]*[^*\s])\*/g, '$1'); // Remove italic *text*
    content = content.replace(/\*([^*\s])\*/g, '$1'); // Remove single char italic *a*

    // 提取标题和元描述（从内容中）
    let title = articleTitle || article.topic;
    let metaDescription = metaDesc || `Comprehensive guide to ${article.topic} with expert insights and practical advice`;
    
    const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // 使用实际生成的标题创建 slug
    const finalArticleSlug = slugify(title);
    
    let savedImages;
    // 如果最终slug与临时slug不同，需要移动图片文件夹
    if (finalArticleSlug !== tempArticleSlug) {
      log(`     📁 Moving images from temp folder (${tempArticleSlug}) to final folder (${finalArticleSlug})`, 'blue');
      
      const tempImageDir = path.join(__dirname, '../temp-images', tempArticleSlug);
      const finalImageDir = path.join(__dirname, '../src/assets/images/articles', finalArticleSlug);
      
      // 移动文件夹
      if (fs.existsSync(tempImageDir)) {
        if (fs.existsSync(finalImageDir)) {
          // 如果目标目录已存在，删除它
          fs.rmSync(finalImageDir, { recursive: true, force: true });
        }
        fs.renameSync(tempImageDir, finalImageDir);
        log(`     ✅ Moved image folder to final location`, 'green');
        
        // 清理临时目录（如果为空）
        const tempBaseDir = path.join(__dirname, '../temp-images');
        try {
          if (fs.existsSync(tempBaseDir) && fs.readdirSync(tempBaseDir).length === 0) {
            fs.rmdirSync(tempBaseDir);
            log(`     🧹 Cleaned up empty temp-images directory`, 'blue');
          }
        } catch (err) {
          // 忽略清理错误
        }
      }
      
      // 更新savedImages路径
      const imageNames = ['cover.png', 'img_0.jpg', 'img_1.jpg', 'img_2.jpg'];
      savedImages = imageNames.map(name => path.join(finalImageDir, name));
    } else {
      // slug没有变化，直接使用已下载的图片
      log(`     ✅ Using already downloaded images (slug unchanged)`, 'green');
      savedImages = tempSavedImages;
    }
    
    // 从内容中移除meta描述行（如果存在）
    content = content.replace(/<p><em>Meta description:<\/em>[^<]*<\/p>\n?/i, '');
    
    // 替换图片占位符为本地图片路径
    const imageNames = ['cover.png', 'img_0.jpg', 'img_1.jpg', 'img_2.jpg'];
    let imageIndex = 0;
    content = content.replace(/<img[^>]*src="[^"]*"[^>]*>/gi, (match) => {
      if (imageIndex < savedImages.length) {
        // 使用Astro的@assets路径格式
        const localPath = `@assets/images/articles/${finalArticleSlug}/${imageNames[imageIndex]}`;
        imageIndex++;
        return match.replace(/src="[^"]*"/, `src="${localPath}"`);
      }
      return match;
    });
    
    // 最终的HTML验证和修复
    const validationResults = finalHtmlValidation(content);
    if (validationResults && validationResults.length > 0) {
      console.warn('❌ Final HTML validation failed:', validationResults);
    }
    
    // 构建完整的HTML文档
    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${metaDescription}" />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
${content}
</body>
</html>`;

    // 使用实际生成的标题作为文件名
    const fileName = title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80) + '.html';

    
    // 保存文件 - 使用当前输出目录
    const outputDir = DEFAULT_CONFIG.currentOutputDir || DEFAULT_CONFIG.outputDir;
    const filePath = path.join(outputDir, fileName);
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
      article  // 添加原始article对象用于更新指纹
    };

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`  ❌ [${index + 1}/${totalCount}] Failed: ${article.topic}`, 'red');
    // 显示完整错误信息
    const errorDetail = error.response?.data || error.message;
    log(`     Error: ${JSON.stringify(errorDetail)} (${elapsed}s)`, 'red');
    console.error('Full error:', error);
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
 * 带位置追踪的重试生成
 */
async function generateWithRetryAndPosition(openai, article, position, index, totalCount, positionTracker, retries = DEFAULT_CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await generateArticleHTML(openai, article, index, totalCount);
    
    if (result.success) {
      // 添加位置信息到结果中
      result.position = position;
      return result;
    }
    
    if (attempt < retries) {
      log(`  🔄 Retrying [${index + 1}] position ${position} (attempt ${attempt + 1}/${retries})...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.retryDelay * attempt));
    }
  }
  
  return { 
    success: false, 
    error: 'Max retries exceeded',
    topic: article.topic,
    position,
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
 * 批处理文章生成（带位置追踪）
 */
async function processBatchWithPositions(openai, articleItems, startIndex, totalCount, positionTracker) {
  const promises = articleItems.map((item, i) => 
    generateWithRetryAndPosition(openai, item.article, item.index, startIndex + i, totalCount, positionTracker)
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
 * 获取要生成的文章列表
 */
function getArticles(options) {
  // 如果指定了自定义主题
  if (options.topic) {
    return [{
      topic: options.topic,
      keywords: options.topic.split(' ').slice(0, 4),
      category: 'Custom'
    }];
  }

  // 如果有配置文件
  if (ARTICLE_CONFIG && ARTICLE_CONFIG.enabled && ARTICLE_CONFIG.articles) {
    const articles = [...ARTICLE_CONFIG.articles];
    // 不在这里应用count限制，让主函数处理skip和count
    return articles;
  }

  // 默认主题列表（备用，优先使用config.template.js）
  const defaultTopics = [
    'Cloud Computing Architecture Best Practices',
    'Machine Learning in Healthcare Applications',
    'Blockchain Technology for Supply Chain',
    'Cybersecurity Threat Detection Systems',
    'DevOps Automation Pipeline Strategies',
    'Data Analytics for Business Intelligence',
    'Artificial Intelligence Ethics Guidelines',
    'Microservices Architecture Patterns',
    'Edge Computing IoT Solutions',
    'Quantum Computing Applications',
    'API Security Best Practices',
    'Container Orchestration Strategies',
    'Serverless Architecture Patterns',
    'Data Privacy Compliance Frameworks',
    'Real-time Analytics Systems'
  ];

  const count = options.count || DEFAULT_CONFIG.articlesPerRun;
  const topics = [];
  
  for (let i = 0; i < count; i++) {
    const topicIndex = i % defaultTopics.length;
    const topic = defaultTopics[topicIndex];
    topics.push({
      topic: topic + (i >= defaultTopics.length ? ` (Part ${Math.floor(i / defaultTopics.length) + 1})` : ''),
      keywords: topic.split(' ').slice(0, 4),
      category: 'Technology'
    });
  }

  return topics;
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // 显示帮助
  if (options.help) {
    showHelp();
    return;
  }

  log('\n====================================', 'bright');
  log('      GPT Article Generator', 'bright');
  log('====================================', 'bright');
  
  // 处理 reset 选项
  if (options.reset) {
    log('\n🔄 Resetting position tracking database...', 'yellow');
    if (fs.existsSync(DEFAULT_CONFIG.fingerprintFile)) {
      fs.unlinkSync(DEFAULT_CONFIG.fingerprintFile);
      log('✅ Position tracking database reset successfully', 'green');
    } else {
      log('ℹ️ No position tracking database found', 'cyan');
    }
    return;
  }
  
  // 显示配置来源
  if (ARTICLE_CONFIG && ARTICLE_CONFIG.enabled && !options.topic) {
    log('Using configuration from config.template.js', 'magenta');
  } else if (options.topic) {
    log('Generating custom topic article', 'magenta');
  } else {
    log('Using default configuration', 'magenta');
  }

  // 加载位置追踪
  let positionTracker = loadPositionTracker();
  log(`📚 Loaded position tracker (${positionTracker.processedPositions.length} processed positions)`, 'cyan');
  
  if (options.force) {
    log('⚠️ Force mode enabled - will regenerate all articles', 'yellow');
  }

  try {
    // 根据scheduled标志选择输出目录
    const outputDir = options.scheduled ? DEFAULT_CONFIG.scheduledOutputDir : DEFAULT_CONFIG.outputDir;
    DEFAULT_CONFIG.currentOutputDir = outputDir; // 保存当前使用的输出目录
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      log(`📁 Created output directory: ${outputDir}`, 'blue');
    }
    
    if (options.scheduled) {
      log('📅 Using scheduled articles folder', 'yellow');
    }

    // 初始化OpenAI
    const openai = initOpenAI();
    log('✅ OpenAI client initialized', 'green');

    // 获取要生成的文章
    let allArticles = getArticles(options);
    
    // 应用skip参数（跳过前N篇文章）
    if (options.skip > 0) {
      const originalCount = allArticles.length;
      allArticles = allArticles.slice(options.skip);
      log(`⏭️ Skipping first ${options.skip} articles (processing positions ${options.skip}-${originalCount - 1})`, 'yellow');
    }
    
    // 筛选未处理的文章
    let articlesToProcess;
    
    if (options.force) {
      // 强制模式：处理所有文章
      articlesToProcess = allArticles.map((article, index) => ({ article, index }));
      log('⚠️ Force mode: will process all articles regardless of previous generation', 'yellow');
    } else {
      // 正常模式：使用位置追踪筛选
      // 注意：当使用skip参数时，需要调整位置索引
      const adjustedArticles = allArticles.map((article, idx) => ({
        article,
        originalIndex: idx + options.skip  // 记录原始位置
      }));
      
      const unprocessed = [];
      const skipped = [];
      
      adjustedArticles.forEach(item => {
        if (positionTracker.processedPositions.includes(item.originalIndex)) {
          skipped.push({ index: item.originalIndex, topic: item.article.topic });
        } else {
          unprocessed.push({ article: item.article, index: item.originalIndex });
        }
      });
      
      articlesToProcess = unprocessed;
      
      // 显示跳过的文章
      skipped.forEach(skip => {
        log(`⏭️  Skipping position ${skip.index}: ${skip.topic}`, 'yellow');
      });
    }
    
    // 应用count限制（如果指定了-c参数）
    if (options.count && options.count > 0 && articlesToProcess.length > options.count) {
      const originalCount = articlesToProcess.length;
      articlesToProcess = articlesToProcess.slice(0, options.count);
      log(`📝 Count limit applied: processing ${options.count} of ${originalCount} unprocessed articles`, 'cyan');
    }
    
    const totalCount = articlesToProcess.length;
    const concurrentBatches = options.concurrent;
    const skippedCount = allArticles.length - totalCount;
    
    log(`\n📊 Generation Summary:`, 'cyan');
    log(`  • Total articles in config: ${allArticles.length}`, 'cyan');
    log(`  • Already processed (skipped): ${skippedCount}`, 'yellow');
    log(`  • Articles to generate: ${totalCount}`, 'green');
    
    if (totalCount === 0) {
      log(`\n✅ All articles have already been generated!`, 'green');
      log(`   Use --force to regenerate all articles`, 'cyan');
      return;
    }
    
    log(`  • Concurrent requests: ${concurrentBatches}`, 'cyan');
    log(`  • Estimated time: ${Math.ceil(totalCount / concurrentBatches * 15)}s`, 'cyan');
    
    if (ARTICLE_CONFIG && ARTICLE_CONFIG.enabled) {
      const categories = [...new Set(articlesToProcess.map(item => item.article.category).filter(Boolean))];
      if (categories.length > 0) {
        log(`  • Categories: ${categories.join(', ')}`, 'cyan');
      }
    }

    log(`\n🚀 Starting article generation...`, 'bright');
    
    // 分批处理
    const results = [];
    let completed = 0;
    
    for (let i = 0; i < articlesToProcess.length; i += concurrentBatches) {
      const batch = articlesToProcess.slice(i, i + concurrentBatches);
      const batchNumber = Math.floor(i / concurrentBatches) + 1;
      const totalBatches = Math.ceil(articlesToProcess.length / concurrentBatches);
      
      log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} articles)...`, 'blue');
      
      // 显示批次中的文章
      batch.forEach((item, idx) => {
        log(`   ${i + idx + 1}. ${item.article.topic} (position ${item.index})`, 'cyan');
      });
      
      const batchResults = await processBatchWithPositions(openai, batch, i, totalCount, positionTracker);
      results.push(...batchResults);
      
      completed += batch.length;
      showProgress(completed, totalCount, startTime);
      
      // 批次间短暂延迟
      if (i + concurrentBatches < articlesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 更新位置追踪
    let positionsUpdated = 0;
    results.filter(r => r.success).forEach(result => {
      if (result.article && result.fileName && result.position !== undefined) {
        positionTracker = updatePositionTracker(positionTracker, result.position, result.article, result.fileName);
        positionsUpdated++;
      }
    });
    
    if (positionsUpdated > 0) {
      savePositionTracker(positionTracker);
      log(`\n💾 Updated position tracker with ${positionsUpdated} positions`, 'green');
    }

    // 统计结果
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTime = (totalTime / results.length).toFixed(1);

    log('\n\n====================================', 'bright');
    log('        Generation Complete', 'bright');
    log('====================================', 'bright');
    
    log('\n📈 Statistics:', 'cyan');
    log(`  ✅ Success: ${successCount}/${totalCount} articles`, 'green');
    if (failedCount > 0) {
      log(`  ❌ Failed: ${failedCount} articles`, 'red');
    }
    log(`  ⏱️  Total time: ${totalTime}s`, 'blue');
    log(`  ⚡ Average: ${avgTime}s per article`, 'blue');

    // 分类统计（如果有分类）
    const categoryStats = {};
    results.filter(r => r.success && r.category).forEach(r => {
      categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
    });
    
    if (Object.keys(categoryStats).length > 0) {
      log('\n📂 Category Distribution:', 'cyan');
      Object.entries(categoryStats).forEach(([cat, count]) => {
        log(`  • ${cat}: ${count} articles`, 'blue');
      });
    }

    if (successCount > 0) {
      log('\n✨ Content Features:', 'green');
      log('  • SEO-optimized with keyword targeting', 'green');
      log('  • AdSense-compliant content', 'green');
      log('  • E-E-A-T signals included', 'green');
      log('  • Professional English writing', 'green');
      log('  • All media elements included', 'green');
      
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
    if (error.message.includes('OPENAI_API_KEY')) {
      log('\n💡 Setup Instructions:', 'yellow');
      log('   1. Create a .env file in the project root', 'yellow');
      log('   2. Add: OPENAI_API_KEY=your-api-key-here', 'yellow');
      log('   3. Get your API key from: https://platform.openai.com/api-keys', 'yellow');
    }
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ Uncaught error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});