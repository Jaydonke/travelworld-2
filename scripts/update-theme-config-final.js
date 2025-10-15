#!/usr/bin/env node

/**
 * 最终版主题配置更新脚本
 * 只更新 CURRENT_WEBSITE_CONTENT 部分
 * 使用完整的结构示例但更精简的提示
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
  timeout: 60000,
  maxRetries: 3
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
 * 获取CURRENT_WEBSITE_CONTENT的完整结构示例
 */
function getContentStructureExample() {
  return `{
  title: "Site Name",
  description: "Site description",
  tagline: "Site tagline",
  author: "Site Team",
  url: "https://domain.com",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",
  
  branding: {
    primaryColor: "#hex",
    secondaryColor: "#hex",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },
  
  colorTheme: {
    primary: "orange", // tailwind color name
    base: "gray",
    primaryShades: {
      50: "orange-50",
      100: "orange-100",
      // ... 200-950
    }
  },
  
  seo: { /* SEO fields */ },
  robots: { index: true, follow: true, sitemap: "/sitemap.xml" },
  theme: { name: "...", category: "...", focus: "...", targetAudience: "..." },
  categories: ["category-1", "category-2"], // 8-12 categories
  images: { /* image config */ },
  ui: { /* UI config */ },
  schema: { /* schema config */ },
  translations: { en: { /* translation keys */ } },
  
  pages: {
    about: {
      title: "About Site",
      subtitle: "...",
      mission: "...",
      whatWeDo: {
        title: "What We Do",
        services: [
          { title: "Service 1", description: "..." },
          { title: "Service 2", description: "..." },
          { title: "Service 3", description: "..." }
        ]
      },
      ourValues: {
        title: "Our Values",
        values: [
          { title: "Value 1", description: "..." },
          { title: "Value 2", description: "..." },
          { title: "Value 3", description: "..." },
          { title: "Value 4", description: "..." }
        ]
      },
      callToAction: { title: "...", description: "...", buttonText: "Explore Resources", buttonLink: "/blog" }
    },
    
    overview: { /* overview fields */ },
    
    support: {
      title: "Help & Support",
      description: "...",
      subtitle: "...",
      quickActions: [
        { text: "Contact Support", href: "#contact-channels", primary: true },
        { text: "Browse FAQ", href: "#faq", primary: false }
      ],
      categories: [
        { id: "getting-started", title: "Getting Started", description: "...", email: "learn@domain", icon: "rocket" },
        { id: "content", title: "Content Questions", description: "...", email: "content@domain", icon: "pencil" },
        { id: "community", title: "Community Support", description: "...", email: "community@domain", icon: "users" },
        { id: "partnerships", title: "Partnerships & Press", description: "...", email: "partnerships@domain", icon: "handshake" }
      ],
      contactChannels: {
        title: "Contact Channels",
        description: "Choose the best way to reach our team",
        channels: [
          { title: "General Support", description: "...", detail: "Response within 24–48 hours", action: "support@domain" },
          { title: "Content Inquiries", description: "...", detail: "Response within 2–3 business days", action: "content@domain" },
          { title: "Business & Partnerships", description: "...", detail: "Response within 3–5 business days", action: "partnerships@domain" },
          { title: "Technical Issues", description: "...", detail: "Response within 24 hours", action: "tech@domain" }
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [ /* 5 Q&A items */ ]
      }
    },
    
    terms: {
      title: "Terms of Service",
      description: "...",
      subtitle: "...",
      lastUpdated: "January 2025",
      introduction: "...",
      sections: [
        { id: "acceptance", title: "1. Acceptance of Terms", content: "..." },
        { 
          id: "use-of-content", 
          title: "2. Use of Content",
          permittedUses: ["..."],
          restrictions: ["..."]
        },
        { id: "content-disclaimer", title: "3. Content Disclaimer", content: "..." },
        {
          id: "user-conduct",
          title: "4. User Conduct",
          content: "...",
          prohibitions: [
            { title: "Violate Laws", description: "..." },
            { title: "Mislead Others", description: "..." },
            { title: "Spread Malware", description: "..." },
            { title: "Unauthorized Access", description: "..." }
          ]
        },
        // ... sections 5-10
      ]
    },
    
    privacy: {
      title: "Privacy Policy",
      description: "...",
      subtitle: "...",
      lastUpdated: "January 2025",
      introduction: "...",
      sections: [
        {
          id: "information-collect",
          title: "1. Information We Collect",
          subsections: [
            {
              title: "Information You Provide",
              content: "...",
              items: ["..."]
            },
            {
              title: "Automatically Collected Information", 
              content: "...",
              items: ["..."]
            }
          ]
        },
        {
          id: "how-we-use",
          title: "2. How We Use Your Information",
          content: "...",
          uses: ["..."]
        },
        // ... sections 3-9
      ]
    }
  },
  
  siteReferences: { /* all email and reference fields */ },
  previewMode: { enabled: false, password: "" },
  newsletter: { /* newsletter config */ }
}`;
}

/**
 * 生成系统提示
 */
function generateSystemPrompt(themeInfo) {
  return `You are a website configuration generator. Generate a complete CURRENT_WEBSITE_CONTENT object for:

Theme: ${themeInfo.theme}
Site Name: ${themeInfo.siteName}  
Domain: ${themeInfo.domain}

Here's the exact structure you must follow (this is the CURRENT_WEBSITE_CONTENT object):

${getContentStructureExample()}

REQUIREMENTS:
1. Replace ALL placeholders with content appropriate for ${themeInfo.theme}
2. Generate 8-12 relevant categories (lowercase with hyphens)
3. Choose appropriate color scheme (use Tailwind color names)
4. Create meaningful FAQ items (5 questions)
5. All services, values, and descriptions must be specific to ${themeInfo.theme}
6. Support section MUST include: quickActions, categories, contactChannels, and faq
7. Terms section MUST have 10 sections with proper structure
8. Privacy section MUST have 9 sections with subsections for information collection

IMPORTANT:
- Maintain the EXACT structure shown above
- Do NOT omit any fields
- Return ONLY the JavaScript object, no markdown or explanations
- Start with { and end with }`;
}

/**
 * 调用OpenAI API生成配置
 */
async function generateThemeConfig(themeInfo) {
  try {
    log(`🤖 Generating configuration for ${themeInfo.theme} theme...`, 'cyan');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a configuration generator. Output only valid JavaScript objects."
        },
        {
          role: "user",
          content: generateSystemPrompt(themeInfo)
        }
      ],
      temperature: 0.7,
      max_tokens: 6000
    });
    
    const configStr = response.choices[0].message.content;
    
    // 清理响应
    const cleanedStr = configStr
      .replace(/```javascript\n?/g, '')
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // 解析并验证配置
    const config = JSON.parse(cleanedStr);
    
    return config;
  } catch (error) {
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
  if (!support.quickActions) {
    log('⚠️  Warning: Support section missing quickActions', 'yellow');
  }
  if (!support.categories) {
    log('⚠️  Warning: Support section missing categories', 'yellow');
  }
  if (!support.contactChannels) {
    log('⚠️  Warning: Support section missing contactChannels', 'yellow');
  }
  if (!support.faq) {
    log('⚠️  Warning: Support section missing faq', 'yellow');
  }
  
  // 检查Terms结构
  if (config.pages.terms.sections) {
    const termsSection2 = config.pages.terms.sections.find(s => s.id === 'use-of-content');
    if (termsSection2 && (!termsSection2.permittedUses || !termsSection2.restrictions)) {
      log('⚠️  Warning: Terms section 2 missing permittedUses or restrictions', 'yellow');
    }
  }
  
  // 检查Privacy结构
  if (config.pages.privacy.sections) {
    const privacySection1 = config.pages.privacy.sections.find(s => s.id === 'information-collect');
    if (privacySection1 && !privacySection1.subsections) {
      log('⚠️  Warning: Privacy section 1 missing subsections', 'yellow');
    }
  }
  
  return true;
}

/**
 * 更新config.template.js文件
 */
function updateConfigFile(config) {
  const configPath = path.join(__dirname, '../config.template.js');
  
  // 创建备份
  const timestamp = Date.now();
  const backupPath = `${configPath}.backup-${timestamp}.js`;
  fs.copyFileSync(configPath, backupPath);
  log(`📋 Created backup: ${path.basename(backupPath)}`, 'green');
  
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
  
  return true;
}

/**
 * 主函数
 */
async function main() {
  try {
    log(`\n🚀 Final Theme Configuration Updater`, 'bright');
    log('Only updates CURRENT_WEBSITE_CONTENT section\n', 'cyan');
    
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
    log(`✅ Base configuration is valid`, 'green');
    
    // 检查完整性
    const support = config.pages.support;
    if (support.quickActions && support.categories && support.contactChannels && support.faq) {
      log(`✅ Support section is complete with all required fields`, 'green');
    } else {
      log(`⚠️  Support section may need manual completion`, 'yellow');
    }
    
    // 更新文件
    log(`\n📝 Updating config.template.js...`, 'blue');
    updateConfigFile(config);
    log(`✅ Successfully updated CURRENT_WEBSITE_CONTENT`, 'green');
    
    log(`\n✨ Configuration updated successfully!`, 'green');
    log(`\n📌 Next steps:`, 'yellow');
    log(`1. Review the updated config.template.js file`, 'yellow');
    log(`2. Run "npm run sync-config-template" to apply changes`, 'yellow');
    log(`3. Restart the development server with "npm run dev"`, 'yellow');
    
    if (support && (!support.quickActions || !support.categories || !support.contactChannels)) {
      log(`\n⚠️  Note: Some support fields may need manual addition`, 'yellow');
      log(`   Check for: quickActions, categories, contactChannels`, 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('API')) {
      log('\n💡 Tips:', 'yellow');
      log('- Check your OPENAI_API_KEY in .env file', 'yellow');
      log('- Ensure you have sufficient API credits', 'yellow');
      log('- Check your internet connection', 'yellow');
    }
    
    if (error.message.includes('JSON')) {
      log('\n💡 The API response may have formatting issues', 'yellow');
      log('- Try running the script again', 'yellow');
      log('- Or manually check the generated content', 'yellow');
    }
    
    process.exit(1);
  }
}

// 运行主函数
main();