#!/usr/bin/env node

/**
 * 优化版主题配置更新脚本
 * 使用更精简的提示词，但包含完整的结构示例
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
 * 生成系统提示（精简版）
 */
function generateSystemPrompt(themeInfo) {
  return `Generate a complete website configuration for:
- Theme: ${themeInfo.theme}
- Site Name: ${themeInfo.siteName}
- Domain: ${themeInfo.domain}

Create a JavaScript object with this EXACT structure (all fields required):

{
  title: "${themeInfo.siteName}",
  description: "comprehensive description for ${themeInfo.theme}",
  tagline: "engaging tagline",
  author: "${themeInfo.siteName} Team",
  url: "https://${themeInfo.domain}",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",
  
  branding: {
    primaryColor: "#hexcode",
    secondaryColor: "#hexcode",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },
  
  colorTheme: {
    primary: "colorname", // use tailwind colors: blue, orange, purple, green, etc
    base: "gray",
    primaryShades: {
      50: "color-50",
      100: "color-100",
      200: "color-200",
      300: "color-300",
      400: "color-400",
      500: "color-500",
      600: "color-600",
      700: "color-700",
      800: "color-800",
      900: "color-900",
      950: "color-950"
    }
  },
  
  seo: { /* standard SEO fields */ },
  robots: { index: true, follow: true, sitemap: "/sitemap.xml" },
  theme: { name: "${themeInfo.siteName}", category: "${themeInfo.theme}", focus: "...", targetAudience: "..." },
  categories: ["cat1", "cat2", ...], // 8-12 categories, lowercase with hyphens
  images: { /* standard image config */ },
  ui: { /* standard UI config */ },
  schema: { /* standard schema config */ },
  translations: { en: { /* all translation keys */ } },
  
  pages: {
    about: {
      title: "About ${themeInfo.siteName}",
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
      callToAction: {
        title: "...",
        description: "...",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    
    overview: {
      title: "What is ${themeInfo.theme}?",
      description: "...",
      footerTagline: "${themeInfo.siteName} — ...",
      footerDescription: "...",
      footerFocus: "Focus: ...",
      sections: { blog: "Articles", info: "Resources", legal: "Legal" }
    },
    
    support: {
      title: "Help & Support",
      description: "Get assistance with ${themeInfo.theme}",
      subtitle: "Expert guidance for your journey.",
      quickActions: [
        { text: "Contact Support", href: "#contact-channels", primary: true },
        { text: "Browse FAQ", href: "#faq", primary: false }
      ],
      categories: [
        { id: "getting-started", title: "Getting Started", description: "...", email: "learn@${themeInfo.domain}", icon: "rocket" },
        { id: "content", title: "Content Questions", description: "...", email: "content@${themeInfo.domain}", icon: "pencil" },
        { id: "community", title: "Community Support", description: "...", email: "community@${themeInfo.domain}", icon: "users" },
        { id: "partnerships", title: "Partnerships & Press", description: "...", email: "partnerships@${themeInfo.domain}", icon: "handshake" }
      ],
      contactChannels: {
        title: "Contact Channels",
        description: "Choose the best way to reach our team",
        channels: [
          { title: "General Support", description: "...", detail: "Response within 24–48 hours", action: "support@${themeInfo.domain}" },
          { title: "Content Inquiries", description: "...", detail: "Response within 2–3 business days", action: "content@${themeInfo.domain}" },
          { title: "Business & Partnerships", description: "...", detail: "Response within 3–5 business days", action: "partnerships@${themeInfo.domain}" },
          { title: "Technical Issues", description: "...", detail: "Response within 24 hours", action: "tech@${themeInfo.domain}" }
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          { question: "Question 1?", answer: "Answer 1" },
          { question: "Question 2?", answer: "Answer 2" },
          { question: "Question 3?", answer: "Answer 3" },
          { question: "Question 4?", answer: "Answer 4" },
          { question: "Question 5?", answer: "Answer 5" }
        ]
      }
    },
    
    terms: {
      title: "Terms of Service",
      description: "Terms and conditions for using ${themeInfo.siteName}'s website and services.",
      subtitle: "By using ${themeInfo.domain}, you agree to these terms.",
      lastUpdated: "January 2025",
      introduction: "Welcome to ${themeInfo.siteName}...",
      sections: [
        { id: "acceptance", title: "1. Acceptance of Terms", content: "..." },
        {
          id: "use-of-content",
          title: "2. Use of Content",
          permittedUses: ["Personal use", "Educational use", "Sharing with attribution"],
          restrictions: ["No unauthorized reproduction", "No unlawful use", "No scraping"]
        },
        { id: "content-disclaimer", title: "3. Content Disclaimer", content: "..." },
        {
          id: "user-conduct",
          title: "4. User Conduct",
          content: "You agree to act lawfully...",
          prohibitions: [
            { title: "Violate Laws", description: "..." },
            { title: "Mislead Others", description: "..." },
            { title: "Spread Malware", description: "..." },
            { title: "Unauthorized Access", description: "..." }
          ]
        },
        { id: "intellectual-property", title: "5. Intellectual Property", content: "...", license: "Limited personal use only." },
        { id: "disclaimers", title: "6. Service Disclaimers", content: "..." },
        { id: "limitation", title: "7. Limitation of Liability", content: "..." },
        { id: "termination", title: "8. Termination", content: "..." },
        { id: "changes", title: "9. Changes to These Terms", content: "..." },
        { id: "contact", title: "10. Contact Information", content: "Contact legal@${themeInfo.domain}." }
      ]
    },
    
    privacy: {
      title: "Privacy Policy",
      description: "Learn how ${themeInfo.siteName} collects, uses, and protects your personal information.",
      subtitle: "Your privacy and data security are our priorities.",
      lastUpdated: "January 2025",
      introduction: "${themeInfo.siteName} is committed to protecting your privacy...",
      sections: [
        {
          id: "information-collect",
          title: "1. Information We Collect",
          subsections: [
            {
              title: "Information You Provide",
              content: "We collect information you provide directly...",
              items: ["Newsletter subscriptions", "Contact forms", "User accounts", "Feedback", "Premium access"]
            },
            {
              title: "Automatically Collected Information",
              content: "We automatically collect...",
              items: ["Device information", "IP address", "Pages viewed", "Referring URLs", "Social media interactions"]
            }
          ]
        },
        {
          id: "how-we-use",
          title: "2. How We Use Your Information",
          content: "We use collected information to:",
          uses: ["Provide services", "Send updates", "Respond to inquiries", "Analyze usage", "Prevent fraud", "Legal compliance"]
        },
        { id: "information-sharing", title: "3. Information Sharing", content: "..." },
        { id: "data-security", title: "4. Data Security", content: "..." },
        { id: "your-rights", title: "5. Your Rights", content: "..." },
        { id: "cookies", title: "6. Cookies and Tracking", content: "..." },
        { id: "children", title: "7. Children's Privacy", content: "..." },
        { id: "changes", title: "8. Changes to This Policy", content: "..." },
        { id: "contact", title: "9. Contact Us", content: "Contact privacy@${themeInfo.domain}." }
      ]
    }
  },
  
  siteReferences: {
    homeTitle: "${themeInfo.siteName}",
    homeDescription: "...",
    homeWelcome: "Welcome to ${themeInfo.siteName}",
    domain: "${themeInfo.domain}",
    generalEmail: "hello@${themeInfo.domain}",
    privacyEmail: "privacy@${themeInfo.domain}",
    legalEmail: "legal@${themeInfo.domain}",
    supportEmail: "support@${themeInfo.domain}",
    techEmail: "tech@${themeInfo.domain}",
    businessEmail: "partnerships@${themeInfo.domain}",
    contentEmail: "content@${themeInfo.domain}",
    faqSiteName: "${themeInfo.siteName}",
    privacyCompanyStatement: "At ${themeInfo.siteName}, we are committed to protecting your privacy.",
    privacyServiceDescription: "${themeInfo.theme} education and resources",
    githubRepo: "https://github.com/${themeInfo.siteName.toLowerCase()}/${themeInfo.siteName.toLowerCase()}",
    liveDemoUrl: "https://${themeInfo.domain}"
  },
  
  previewMode: { enabled: false, password: "" },
  
  newsletter: {
    title: "${themeInfo.siteName} Newsletter",
    description: "Get weekly ${themeInfo.theme} insights and updates.",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
}

IMPORTANT:
- Fill ALL "..." placeholders with appropriate content for ${themeInfo.theme}
- Generate 8-12 relevant categories
- Create 5 meaningful FAQ items
- All content must be specific to ${themeInfo.theme}
- Return ONLY the JavaScript object, no markdown or explanations`;
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
          content: generateSystemPrompt(themeInfo)
        },
        {
          role: "user",
          content: `Generate the complete configuration object for ${themeInfo.theme} theme. Fill all placeholders with appropriate content.`
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
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
  if (!support.quickActions || !support.categories || 
      !support.contactChannels || !support.faq) {
    log('⚠️  Warning: Support section may be incomplete', 'yellow');
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
    log(`\n🚀 Optimized Theme Configuration Updater`, 'bright');
    log('');
    
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
    log(`🔍 Validating generated configuration...`, 'blue');
    validateConfig(config);
    log(`✅ Configuration is valid`, 'green');
    
    // 检查关键部分
    if (config.pages.support.quickActions && config.pages.support.categories && 
        config.pages.support.contactChannels) {
      log(`✅ Support section is complete`, 'green');
    }
    
    // 更新文件
    log(`📝 Updating config.template.js...`, 'blue');
    updateConfigFile(config);
    log(`✅ Successfully updated config.template.js`, 'green');
    
    log(`\n✨ Configuration updated successfully!`, 'green');
    log(`\n📌 Next steps:`, 'yellow');
    log(`1. Review the updated config.template.js file`, 'yellow');
    log(`2. Run "npm run sync-config-template" to apply changes`, 'yellow');
    log(`3. Restart the development server with "npm run dev"`, 'yellow');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('API')) {
      log('\n💡 Tips:', 'yellow');
      log('- Check your OPENAI_API_KEY in .env file', 'yellow');
      log('- Ensure you have sufficient API credits', 'yellow');
      log('- Check your internet connection', 'yellow');
    }
    
    process.exit(1);
  }
}

// 运行主函数
main();