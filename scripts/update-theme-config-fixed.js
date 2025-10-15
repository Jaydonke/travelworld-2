#!/usr/bin/env node

/**
 * 修复版主题配置更新脚本
 * 只更新 CURRENT_WEBSITE_CONTENT 部分
 * 改进了错误处理和JSON解析
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

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

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000, // 增加到3分钟
  maxRetries: 2
});

/**
 * 读取config.txt文件
 */
function readConfigFile() {
  const configPath = path.join(__dirname, '../config.txt');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('config.txt file not found');
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length < 3) {
    throw new Error('config.txt must have at least 3 lines: theme, domain, site name');
  }
  
  return {
    theme: lines[0].trim(),
    domain: lines[1].trim(),
    siteName: lines[2].trim()
  };
}

/**
 * 生成系统提示 - 简化版，使用JSON格式
 */
function generateSystemPrompt(themeInfo) {
  return `Generate a complete website configuration object for:
Theme: ${themeInfo.theme}
Site Name: ${themeInfo.siteName}
Domain: ${themeInfo.domain}

Create a valid JSON object with this exact structure:

{
  "title": "${themeInfo.siteName}",
  "description": "Your description for ${themeInfo.theme}",
  "tagline": "Your tagline",
  "author": "${themeInfo.siteName} Team",
  "url": "https://${themeInfo.domain}",
  "locale": "en-US",
  "dir": "ltr",
  "charset": "UTF-8",
  "basePath": "/",
  "postsPerPage": 5,
  "googleAnalyticsId": "",
  
  "branding": {
    "primaryColor": "Choose a primary hex color appropriate for ${themeInfo.theme} (e.g., #3B82F6 for education, #10B981 for health, #F97316 for productivity)",
    "secondaryColor": "Choose a secondary hex color that complements the primary",
    "surfaceColor": "#F9FAFB",
    "fontFamily": "Inter, system-ui, sans-serif",
    "logoUrl": "/images/logo.png",
    "faviconUrl": "/favicon.ico"
  },

  "colorTheme": {
    "primary": "Choose a Tailwind color name appropriate for ${themeInfo.theme} (blue for education, green for health, orange for productivity, purple for creativity, etc.)",
    "base": "gray",
    "primaryShades": {
      "50": "[primary-color]-50",
      "100": "[primary-color]-100",
      "200": "[primary-color]-200",
      "300": "[primary-color]-300",
      "400": "[primary-color]-400",
      "500": "[primary-color]-500",
      "600": "[primary-color]-600",
      "700": "[primary-color]-700",
      "800": "[primary-color]-800",
      "900": "[primary-color]-900",
      "950": "[primary-color]-950"
    }
  },
  
  "seo": {
    "defaultTitle": "${themeInfo.siteName} - ${themeInfo.theme}",
    "titleTemplate": "%s | ${themeInfo.siteName}",
    "defaultDescription": "Your SEO description",
    "defaultImage": "/images/og/${themeInfo.siteName.toLowerCase()}-1200x630.jpg",
    "twitterHandle": "@${themeInfo.siteName.toLowerCase()}",
    "locale": "en_US",
    "type": "website"
  },
  
  "robots": {
    "index": true,
    "follow": true,
    "sitemap": "/sitemap.xml"
  },
  
  "theme": {
    "name": "${themeInfo.siteName}",
    "category": "${themeInfo.theme}",
    "focus": "Your focus description",
    "targetAudience": "Your target audience"
  },
  
  "categories": ["category-1", "category-2", "category-3", "category-4", "category-5", "category-6", "category-7", "category-8"],
  
  "images": {
    "optimization": {
      "enabled": true,
      "quality": 85,
      "formats": ["webp", "avif"]
    },
    "lazyLoading": true,
    "placeholder": "blur",
    "paths": {
      "og": "/images/og/${themeInfo.siteName.toLowerCase()}-1200x630.jpg",
      "hero": "/images/hero/${themeInfo.siteName.toLowerCase()}-hero.png"
    }
  },
  
  "ui": {
    "navbar": {
      "sticky": true,
      "showSearch": true,
      "showThemeToggle": false
    },
    "footer": {
      "showNewsletter": true,
      "showSocialLinks": true,
      "showCategories": true,
      "copyrightText": "© 2025 ${themeInfo.siteName}. All rights reserved.",
      "accessibilityNote": "Images include descriptive alt text; emoji have accessible labels."
    },
    "homepage": {
      "showHero": true,
      "showFeaturedPosts": true,
      "showCategories": true,
      "showLatestPosts": true,
      "heroTitle": "Welcome to ${themeInfo.siteName}",
      "heroSubtitle": "Your subtitle here",
      "heroImage": "/images/hero/${themeInfo.siteName.toLowerCase()}-hero.png",
      "heroImageAlt": "${themeInfo.theme} hero image"
    },
    "categoriesPage": {
      "title": "Content Categories",
      "description": "Explore our categories",
      "subtitle": "Find what interests you"
    },
    "images": {
      "enforceAlt": true
    },
    "componentColors": {
      "pagination": {
        "activeBackground": "from-[primary-color]-500 to-[primary-color]-600",
        "activeText": "text-base-100"
      },
      "newsletter": {
        "glowEffect": "from-[primary-color]-500 to-[primary-color]-600",
        "glowOpacity": "opacity-30"
      }
    }
  },
  
  "schema": {
    "article": {
      "enabled": true,
      "defaultAuthor": "${themeInfo.siteName} Team"
    },
    "organization": {
      "enabled": true
    },
    "website": {
      "enabled": true
    }
  },
  
  "translations": {
    "en": {
      "hero_description": "Your hero description",
      "back_to_all_posts": "Back to all articles",
      "updated_on": "Updated on",
      "read_more": "Read more",
      "categories": "Categories",
      "table_of_contents": "Table of Contents",
      "share_this_post": "Share this article",
      "search_placeholder": "Search articles...",
      "no_posts_found": "No articles found",
      "showing_results_for": "Showing results for",
      "newsletter_title": "${themeInfo.siteName} Newsletter",
      "newsletter_description": "Get updates delivered to your inbox",
      "newsletter_placeholder": "Enter your email",
      "newsletter_button": "Subscribe",
      "footer_rights": "All rights reserved"
    }
  },
  
  "pages": {
    "about": {
      "title": "About ${themeInfo.siteName}",
      "subtitle": "Your subtitle",
      "mission": "Your mission statement",
      "whatWeDo": {
        "title": "What We Do",
        "services": [
          {"title": "Service 1", "description": "Service 1 description"},
          {"title": "Service 2", "description": "Service 2 description"},
          {"title": "Service 3", "description": "Service 3 description"}
        ]
      },
      "ourValues": {
        "title": "Our Values",
        "values": [
          {"title": "Value 1", "description": "Value 1 description"},
          {"title": "Value 2", "description": "Value 2 description"},
          {"title": "Value 3", "description": "Value 3 description"},
          {"title": "Value 4", "description": "Value 4 description"}
        ]
      },
      "callToAction": {
        "title": "Join Us",
        "description": "Start your journey today",
        "buttonText": "Explore Resources",
        "buttonLink": "/blog"
      }
    },
    
    "overview": {
      "title": "What is ${themeInfo.theme}?",
      "description": "Understanding ${themeInfo.theme}",
      "footerTagline": "${themeInfo.siteName} — Your tagline",
      "footerDescription": "Footer description",
      "footerFocus": "Focus: Your focus area",
      "sections": {
        "blog": "Articles",
        "info": "Resources",
        "legal": "Legal"
      }
    },
    
    "support": {
      "title": "Help & Support",
      "description": "Get assistance with ${themeInfo.theme}",
      "subtitle": "Expert guidance for your journey.",
      "quickActions": [
        {"text": "Contact Support", "href": "#contact-channels", "primary": true},
        {"text": "Browse FAQ", "href": "#faq", "primary": false}
      ],
      "categories": [
        {"id": "getting-started", "title": "Getting Started", "description": "Learn the basics", "email": "learn@${themeInfo.domain}", "icon": "rocket"},
        {"id": "content", "title": "Content Questions", "description": "Content help", "email": "content@${themeInfo.domain}", "icon": "pencil"},
        {"id": "community", "title": "Community Support", "description": "Community help", "email": "community@${themeInfo.domain}", "icon": "users"},
        {"id": "partnerships", "title": "Partnerships & Press", "description": "Business inquiries", "email": "partnerships@${themeInfo.domain}", "icon": "handshake"}
      ],
      "contactChannels": {
        "title": "Contact Channels",
        "description": "Choose the best way to reach our team",
        "channels": [
          {"title": "General Support", "description": "General questions", "detail": "Response within 24–48 hours", "action": "support@${themeInfo.domain}"},
          {"title": "Content Inquiries", "description": "Content questions", "detail": "Response within 2–3 business days", "action": "content@${themeInfo.domain}"},
          {"title": "Business & Partnerships", "description": "Business inquiries", "detail": "Response within 3–5 business days", "action": "partnerships@${themeInfo.domain}"},
          {"title": "Technical Issues", "description": "Technical help", "detail": "Response within 24 hours", "action": "tech@${themeInfo.domain}"}
        ]
      },
      "faq": {
        "title": "Frequently Asked Questions",
        "items": [
          {"question": "How do I get started?", "answer": "Start by exploring our resources."},
          {"question": "Is this service free?", "answer": "Yes, basic access is free."},
          {"question": "How can I contribute?", "answer": "Contact us to learn about contribution opportunities."},
          {"question": "What support is available?", "answer": "We offer email and community support."},
          {"question": "How often is content updated?", "answer": "We update content regularly."}
        ]
      }
    },
    
    "terms": {
      "title": "Terms of Service",
      "description": "Terms and conditions for using ${themeInfo.siteName}'s website and services.",
      "subtitle": "By using ${themeInfo.domain}, you agree to these terms.",
      "lastUpdated": "January 2025",
      "introduction": "Welcome to ${themeInfo.siteName}. These Terms of Service govern your use of our website.",
      "sections": [
        {"id": "acceptance", "title": "1. Acceptance of Terms", "content": "By accessing our website, you agree to these terms."},
        {
          "id": "use-of-content",
          "title": "2. Use of Content",
          "permittedUses": ["Personal use", "Educational use", "Sharing with attribution"],
          "restrictions": ["No unauthorized reproduction", "No commercial use without permission", "No scraping"]
        },
        {"id": "content-disclaimer", "title": "3. Content Disclaimer", "content": "Content is for informational purposes only."},
        {
          "id": "user-conduct",
          "title": "4. User Conduct",
          "content": "You agree to act lawfully and respectfully.",
          "prohibitions": [
            {"title": "Violate Laws", "description": "Do not use for illegal purposes"},
            {"title": "Mislead Others", "description": "Do not provide false information"},
            {"title": "Spread Malware", "description": "Do not transmit harmful code"},
            {"title": "Unauthorized Access", "description": "Do not attempt unauthorized access"}
          ]
        },
        {"id": "intellectual-property", "title": "5. Intellectual Property", "content": "All content is protected by copyright.", "license": "Limited personal use only."},
        {"id": "disclaimers", "title": "6. Service Disclaimers", "content": "Service provided as-is without warranties."},
        {"id": "limitation", "title": "7. Limitation of Liability", "content": "We are not liable for damages."},
        {"id": "termination", "title": "8. Termination", "content": "We may terminate access at any time."},
        {"id": "changes", "title": "9. Changes to These Terms", "content": "We may update terms at any time."},
        {"id": "contact", "title": "10. Contact Information", "content": "Contact legal@${themeInfo.domain} for questions."}
      ]
    },
    
    "privacy": {
      "title": "Privacy Policy",
      "description": "Learn how ${themeInfo.siteName} collects, uses, and protects your personal information.",
      "subtitle": "Your privacy and data security are our priorities.",
      "lastUpdated": "January 2025",
      "introduction": "${themeInfo.siteName} is committed to protecting your privacy.",
      "sections": [
        {
          "id": "information-collect",
          "title": "1. Information We Collect",
          "subsections": [
            {
              "title": "Information You Provide",
              "content": "We collect information you provide directly.",
              "items": ["Email addresses", "Contact information", "User preferences", "Feedback", "Account details"]
            },
            {
              "title": "Automatically Collected Information",
              "content": "We automatically collect certain technical data.",
              "items": ["Device information", "IP address", "Browser type", "Pages viewed", "Referring sites"]
            }
          ]
        },
        {
          "id": "how-we-use",
          "title": "2. How We Use Your Information",
          "content": "We use information to:",
          "uses": ["Provide services", "Send updates", "Respond to inquiries", "Improve our site", "Ensure security", "Legal compliance"]
        },
        {"id": "information-sharing", "title": "3. Information Sharing", "content": "We do not sell personal information."},
        {"id": "data-security", "title": "4. Data Security", "content": "We implement security measures to protect your data."},
        {"id": "your-rights", "title": "5. Your Rights", "content": "You have rights regarding your personal data."},
        {"id": "cookies", "title": "6. Cookies and Tracking", "content": "We use cookies to enhance your experience."},
        {"id": "children", "title": "7. Children's Privacy", "content": "Our services are not directed to children under 13."},
        {"id": "changes", "title": "8. Changes to This Policy", "content": "We may update this policy periodically."},
        {"id": "contact", "title": "9. Contact Us", "content": "Contact privacy@${themeInfo.domain} with questions."}
      ]
    }
  },
  
  "siteReferences": {
    "homeTitle": "${themeInfo.siteName}",
    "homeDescription": "Your destination for ${themeInfo.theme}",
    "homeWelcome": "Welcome to ${themeInfo.siteName}",
    "domain": "${themeInfo.domain}",
    "generalEmail": "hello@${themeInfo.domain}",
    "privacyEmail": "privacy@${themeInfo.domain}",
    "legalEmail": "legal@${themeInfo.domain}",
    "supportEmail": "support@${themeInfo.domain}",
    "techEmail": "tech@${themeInfo.domain}",
    "businessEmail": "partnerships@${themeInfo.domain}",
    "contentEmail": "content@${themeInfo.domain}",
    "faqSiteName": "${themeInfo.siteName}",
    "privacyCompanyStatement": "At ${themeInfo.siteName}, we are committed to protecting your privacy and securing your data.",
    "privacyServiceDescription": "${themeInfo.theme} education and resources",
    "githubRepo": "https://github.com/${themeInfo.siteName.toLowerCase()}/${themeInfo.siteName.toLowerCase()}",
    "liveDemoUrl": "https://${themeInfo.domain}"
  },
  
  "previewMode": {
    "enabled": false,
    "password": ""
  },
  
  "newsletter": {
    "title": "${themeInfo.siteName} Newsletter",
    "description": "Get weekly ${themeInfo.theme} insights and updates.",
    "emailPlaceholder": "Enter your email",
    "subscribeButton": "Subscribe",
    "privacyNote": "We respect your privacy. Unsubscribe anytime."
  }
}

IMPORTANT RULES:
1. Replace ALL placeholder text with appropriate content for ${themeInfo.theme}
2. Generate 8-12 relevant categories (lowercase with hyphens)
3. COLOR SELECTION:
   - For Education themes: use blue (#3B82F6) as primary, blue-700 (#1D4ED8) as secondary, "blue" for colorTheme
   - For Health/Wellness: use green (#10B981) as primary, green-700 (#047857) as secondary, "green" for colorTheme
   - For Career/Productivity: use orange (#F97316) as primary, orange-700 (#C2410C) as secondary, "orange" for colorTheme
   - For Technology: use purple (#8B5CF6) as primary, purple-700 (#6D28D9) as secondary, "purple" for colorTheme
   - For Finance: use emerald (#10B981) as primary, emerald-700 (#047857) as secondary, "emerald" for colorTheme
   - For Entertainment: use pink (#EC4899) as primary, pink-700 (#BE185D) as secondary, "pink" for colorTheme
   - For other themes: choose appropriate colors that match the theme's nature
   - Replace [primary-color] placeholders with the actual color name (e.g., blue-500, green-500)
   - Use consistent color throughout (if you choose blue, use blue-50 through blue-950)
4. Make all descriptions specific to ${themeInfo.theme}
5. Return ONLY valid JSON - no comments, no JavaScript syntax
6. Do NOT use single quotes, only double quotes
7. Ensure all arrays and objects are properly closed
8. CRITICAL: Replace ALL placeholders including color instructions with actual values`;
}

/**
 * 调用OpenAI API生成配置
 */
async function generateThemeConfig(themeInfo) {
  try {
    log(`🤖 Generating configuration for ${themeInfo.theme} theme...`, 'cyan');
    log(`⏱️  This may take up to 3 minutes, please wait...`, 'yellow');
    
    const startTime = Date.now();
    log(`🔄 Starting OpenAI API request...`, 'blue');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Output ONLY valid JSON without any markdown, comments, or explanations."
        },
        {
          role: "user",
          content: generateSystemPrompt(themeInfo)
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    });
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ OpenAI API request completed in ${elapsedTime}s`, 'green');
    
    let configStr = response.choices[0].message.content;
    
    // 调试：记录原始响应的前100个字符
    log(`📄 Response preview: ${configStr.substring(0, 100)}...`, 'blue');
    log(`📏 Response length: ${configStr.length} characters`, 'gray');
    
    log(`🧹 Cleaning response format...`, 'blue');
    
    // 清理响应 - 更严格的清理
    const originalLength = configStr.length;
    configStr = configStr
      .replace(/^```json\s*/i, '')
      .replace(/^```javascript\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    
    if (originalLength !== configStr.length) {
      log(`📝 Removed markdown formatting (${originalLength - configStr.length} chars)`, 'gray');
    }
    
    // 如果响应以 'export' 或其他非JSON内容开始，尝试提取JSON部分
    if (!configStr.startsWith('{')) {
      const jsonMatch = configStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        configStr = jsonMatch[0];
      }
    }
    
    log(`🔍 Parsing JSON configuration...`, 'blue');
    
    // 尝试解析JSON
    let config;
    try {
      config = JSON.parse(configStr);
      log(`✅ JSON parsing successful on first attempt!`, 'green');
    } catch (parseError) {
      // 如果解析失败，尝试修复常见问题
      log(`⚠️  Initial parse failed: ${parseError.message}`, 'yellow');
      log('🔧 Attempting to fix common JSON issues...', 'blue');
      
      // 移除JavaScript注释
      configStr = configStr.replace(/\/\*[\s\S]*?\*\//g, '');
      configStr = configStr.replace(/\/\/.*/g, '');
      
      log('🔄 Retrying JSON parsing after fixes...', 'blue');
      // 尝试再次解析
      config = JSON.parse(configStr);
      log(`✅ JSON parsing successful after fixes!`, 'green');
    }
    
    log('✅ Successfully parsed configuration', 'green');
    return config;
    
  } catch (error) {
    log(`❌ Configuration generation failed: ${error.message}`, 'red');
    
    // 保存失败的响应用于调试
    const debugPath = path.join(__dirname, '../debug-response.txt');
    if (error.message.includes('JSON') && response?.choices?.[0]?.message?.content) {
      fs.writeFileSync(debugPath, response.choices[0].message.content, 'utf-8');
      log(`💾 Saved failed response to debug-response.txt for inspection`, 'yellow');
      log(`📄 You can examine the raw response to see what went wrong`, 'yellow');
    }
    
    // 提供更详细的错误信息
    if (error.message.includes('timeout') || error.message.includes('Request timed out')) {
      log(`🕐 This was a timeout error - try running the script again`, 'yellow');
      log(`⏱️  The timeout is now set to 3 minutes (180 seconds)`, 'gray');
    }
    
    throw new Error(`Failed to generate configuration: ${error.message}`);
  }
}

/**
 * 验证生成的配置
 */
function validateConfig(config) {
  const requiredFields = [
    'title', 'description', 'tagline', 'author', 'url',
    'branding', 'colorTheme', 'seo', 'theme', 'categories',
    'pages', 'siteReferences', 'newsletter'
  ];
  
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // 验证pages部分
  const requiredPages = ['about', 'overview', 'support', 'terms', 'privacy'];
  const missingPages = requiredPages.filter(page => !config.pages[page]);
  
  if (missingPages.length > 0) {
    throw new Error(`Missing required pages: ${missingPages.join(', ')}`);
  }
  
  // 验证support部分的完整性
  const support = config.pages.support;
  const supportChecks = {
    quickActions: support.quickActions,
    categories: support.categories,
    contactChannels: support.contactChannels,
    faq: support.faq
  };
  
  const missingSupportFields = Object.keys(supportChecks).filter(key => !supportChecks[key]);
  if (missingSupportFields.length > 0) {
    log(`⚠️  Support section missing: ${missingSupportFields.join(', ')}`, 'yellow');
  } else {
    log('✅ Support section is complete', 'green');
  }
  
  return true;
}

/**
 * 更新config.template.js文件
 */
function updateConfigFile(config) {
  const configPath = path.join(__dirname, '../config.template.js');

  // 创建完整备份到 config-backups 目录
  const backupsDir = path.join(__dirname, '../config-backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(backupsDir, `config.template.js.backup-full-${timestamp}.js`);
  fs.copyFileSync(configPath, backupPath);
  log(`📋 Created full backup: config-backups/${path.basename(backupPath)}`, 'green');

  // 读取现有文件
  let fileContent = fs.readFileSync(configPath, 'utf-8');

  // 生成新的CURRENT_WEBSITE_CONTENT
  const newContent = `export const CURRENT_WEBSITE_CONTENT = ${JSON.stringify(config, null, 2)};`;

  // 替换CURRENT_WEBSITE_CONTENT部分
  const regex = /export\s+const\s+CURRENT_WEBSITE_CONTENT\s*=\s*\{[\s\S]*?\n\};/;

  if (!regex.test(fileContent)) {
    throw new Error('Could not find CURRENT_WEBSITE_CONTENT in config file');
  }

  fileContent = fileContent.replace(regex, newContent);

  // 写入文件
  fs.writeFileSync(configPath, fileContent, 'utf-8');

  log(`✅ Updated CURRENT_WEBSITE_CONTENT in config.template.js`, 'green');

  return true;
}

/**
 * 更新astro.config.mjs文件的site配置
 */
function updateAstroConfig(domain) {
  const astroConfigPath = path.join(__dirname, '../astro.config.mjs');

  try {
    // 读取文件
    let fileContent = fs.readFileSync(astroConfigPath, 'utf-8');

    // 构建完整的URL（添加https://）
    const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    // 替换site配置
    // 匹配 site: "任何内容"
    const siteRegex = /site:\s*["']([^"']+)["']/;

    if (!siteRegex.test(fileContent)) {
      log(`⚠️  Could not find site configuration in astro.config.mjs`, 'yellow');
      return false;
    }

    const oldSite = fileContent.match(siteRegex)[1];
    fileContent = fileContent.replace(siteRegex, `site: "${siteUrl}"`);

    // 写入文件
    fs.writeFileSync(astroConfigPath, fileContent, 'utf-8');

    log(`🌐 Updated astro.config.mjs:`, 'green');
    log(`   Old: ${oldSite}`, 'gray');
    log(`   New: ${siteUrl}`, 'cyan');

    return true;
  } catch (error) {
    log(`⚠️  Failed to update astro.config.mjs: ${error.message}`, 'yellow');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log(`\n🚀 Fixed Theme Configuration Updater`, 'bright');
    log('Updates CURRENT_WEBSITE_CONTENT with complete structure\n', 'cyan');
    
    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in .env file');
    }
    
    // 读取配置
    log(`📖 Reading config.txt...`, 'blue');
    const themeInfo = readConfigFile();
    log(`  Theme: ${themeInfo.theme}`, 'cyan');
    log(`  Domain: ${themeInfo.domain}`, 'cyan');
    log(`  Site Name: ${themeInfo.siteName}`, 'cyan');
    
    // 生成配置
    const config = await generateThemeConfig(themeInfo);
    
    // 验证配置
    log(`\n🔍 Validating generated configuration...`, 'blue');
    validateConfig(config);
    log(`✅ Configuration structure is valid`, 'green');
    
    // 更新文件
    log(`\n📝 Updating config.template.js...`, 'blue');
    updateConfigFile(config);

    // 更新astro.config.mjs的site配置
    log(`\n🌐 Updating astro.config.mjs site URL...`, 'blue');
    updateAstroConfig(themeInfo.domain);

    log(`\n✨ Configuration updated successfully!`, 'green');
    log(`\n📌 Next steps:`, 'yellow');
    log(`1. Review the updated config.template.js file`, 'yellow');
    log(`2. Review the updated astro.config.mjs file`, 'yellow');
    log(`3. Run "npm run sync-config-template" to apply changes`, 'yellow');
    log(`4. Restart the development server with "npm run dev"`, 'yellow');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('API')) {
      log('\n💡 Tips:', 'yellow');
      log('- Check your OPENAI_API_KEY in .env file', 'yellow');
      log('- Ensure you have sufficient API credits', 'yellow');
      log('- Check your internet connection', 'yellow');
    }
    
    if (error.message.includes('JSON')) {
      log('\n💡 JSON parsing failed. Check debug-response.txt for the raw response', 'yellow');
      log('- The API may have returned invalid JSON', 'yellow');
      log('- Try running the script again', 'yellow');
    }
    
    process.exit(1);
  }
}

// 运行主函数
main();