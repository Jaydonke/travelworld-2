#!/usr/bin/env node

/**
 * 主题配置更新脚本
 * 通过OpenAI API根据新主题生成完整的网站配置
 * 使用方法: npm run update-theme 或 node scripts/update-theme-config.js
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
 * 生成主题配置的系统提示
 */
function generateSystemPrompt(themeInfo) {
  return `You are a website configuration generator specializing in creating comprehensive website configurations for different themes and niches.

Generate a complete website configuration for a ${themeInfo.theme} website named "${themeInfo.siteName}" with domain "${themeInfo.domain}".

The configuration must follow this EXACT structure:
{
  title: "string",
  description: "string",
  tagline: "string",
  author: "string",
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
    primary: "colorname", // e.g., "blue", "orange", "purple"
    base: "gray",
    primaryShades: {
      50: "color-50",
      100: "color-100",
      // ... all shades from 50 to 950
    }
  },
  
  seo: {
    defaultTitle: "string",
    titleTemplate: "%s | ${themeInfo.siteName}",
    defaultDescription: "string",
    defaultImage: "/images/og/${themeInfo.siteName.toLowerCase()}-1200x630.jpg",
    twitterHandle: "@${themeInfo.siteName.toLowerCase()}",
    locale: "en_US",
    type: "website"
  },
  
  robots: {
    index: true,
    follow: true,
    sitemap: "/sitemap.xml"
  },
  
  theme: {
    name: "${themeInfo.siteName}",
    category: "${themeInfo.theme}",
    focus: "string describing focus",
    targetAudience: "string describing audience"
  },
  
  categories: [
    // Array of category strings (8-12 categories)
  ],
  
  images: {
    optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
    lazyLoading: true,
    placeholder: "blur",
    paths: {
      og: "/images/og/${themeInfo.siteName.toLowerCase()}-1200x630.jpg",
      hero: "/images/hero/${themeInfo.siteName.toLowerCase()}-hero.png"
    }
  },
  
  ui: {
    navbar: { sticky: true, showSearch: true, showThemeToggle: false },
    footer: {
      showNewsletter: true,
      showSocialLinks: true,
      showCategories: true,
      copyrightText: "© 2025 ${themeInfo.siteName}. All rights reserved.",
      accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
    },
    homepage: {
      showHero: true,
      showFeaturedPosts: true,
      showCategories: true,
      showLatestPosts: true,
      heroTitle: "string",
      heroSubtitle: "string",
      heroImage: "/images/hero/${themeInfo.siteName.toLowerCase()}-hero.png",
      heroImageAlt: "${themeInfo.theme} hero image"
    },
    categoriesPage: {
      title: "Content Categories",
      description: "string",
      subtitle: "string"
    },
    images: { enforceAlt: true },
    componentColors: {
      pagination: {
        activeBackground: "from-primary-500 to-primary-600",
        activeText: "text-base-100"
      },
      newsletter: {
        glowEffect: "from-primary-500 to-primary-600",
        glowOpacity: "opacity-30"
      }
    }
  },
  
  schema: {
    article: { enabled: true, defaultAuthor: "${themeInfo.siteName} Team" },
    organization: { enabled: true },
    website: { enabled: true }
  },
  
  translations: {
    en: {
      hero_description: "string",
      back_to_all_posts: "Back to all articles",
      updated_on: "Updated on",
      read_more: "Read more",
      categories: "Categories",
      table_of_contents: "Table of Contents",
      share_this_post: "Share this article",
      search_placeholder: "Search articles...",
      no_posts_found: "No articles found",
      showing_results_for: "Showing results for",
      newsletter_title: "${themeInfo.siteName} Newsletter",
      newsletter_description: "string",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      footer_rights: "All rights reserved"
    }
  },
  
  pages: {
    about: {
      title: "About ${themeInfo.siteName}",
      subtitle: "string",
      mission: "string",
      whatWeDo: {
        title: "What We Do",
        services: [
          { title: "Service 1", description: "Description" },
          { title: "Service 2", description: "Description" },
          { title: "Service 3", description: "Description" }
        ]
      },
      ourValues: {
        title: "Our Values",
        values: [
          { title: "Value 1", description: "Description" },
          { title: "Value 2", description: "Description" },
          { title: "Value 3", description: "Description" },
          { title: "Value 4", description: "Description" }
        ]
      },
      callToAction: {
        title: "string",
        description: "string",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    
    overview: {
      title: "What is ${themeInfo.theme}?",
      description: "string",
      footerTagline: "${themeInfo.siteName} — string",
      footerDescription: "string",
      footerFocus: "Focus: string",
      sections: {
        blog: "Articles",
        info: "Resources",
        legal: "Legal"
      }
    },
    
    support: {
      title: "Help & Support",
      description: "Get assistance with ${themeInfo.theme}",
      subtitle: "Expert guidance for your journey.",
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
      introduction: "Welcome to ${themeInfo.siteName}. These Terms of Service...",
      sections: [
        // Generate 10 sections with appropriate content
      ]
    },
    
    privacy: {
      title: "Privacy Policy",
      description: "Learn how ${themeInfo.siteName} collects, uses, and protects your personal information.",
      subtitle: "Your privacy and data security are our priorities.",
      lastUpdated: "January 2025",
      introduction: "${themeInfo.siteName} is committed to protecting your privacy...",
      sections: [
        // Generate 9 sections with appropriate content
      ]
    }
  },
  
  siteReferences: {
    homeTitle: "${themeInfo.siteName}",
    homeDescription: "string",
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
    privacyCompanyStatement: "At ${themeInfo.siteName}, we are committed to protecting your privacy and securing your data.",
    privacyServiceDescription: "${themeInfo.theme} education and resources",
    githubRepo: "https://github.com/${themeInfo.siteName.toLowerCase()}/${themeInfo.siteName.toLowerCase()}",
    liveDemoUrl: "https://${themeInfo.domain}"
  },
  
  previewMode: {
    enabled: false,
    password: ""
  },
  
  newsletter: {
    title: "${themeInfo.siteName} Newsletter",
    description: "Get weekly ${themeInfo.theme} insights and updates.",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
}

Make sure:
1. Categories should be lowercase with hyphens (e.g., "real-estate", "technical-guides")
2. Color theme primary should be a Tailwind color name (blue, orange, purple, etc.)
3. All service and value items should be relevant to ${themeInfo.theme}
4. Terms sections should follow the exact structure from the example with id, title, content, and subsections where appropriate
5. Privacy sections should follow the exact structure with subsections for information collection

IMPORTANT: Return only the JavaScript object, no markdown, no explanations, just the raw object starting with { and ending with }`;
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
          content: `Generate a complete website configuration for:
Theme: ${themeInfo.theme}
Domain: ${themeInfo.domain}
Site Name: ${themeInfo.siteName}

Include all sections mentioned in the instructions with realistic, professional content.`
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    });
    
    const content = response.choices[0].message.content;
    
    // 清理响应内容
    let cleanedContent = content.trim();
    
    // 移除可能的markdown代码块标记
    cleanedContent = cleanedContent.replace(/^```javascript\s*/i, '');
    cleanedContent = cleanedContent.replace(/^```js\s*/i, '');
    cleanedContent = cleanedContent.replace(/^```\s*/i, '');
    cleanedContent = cleanedContent.replace(/\s*```$/i, '');
    
    // 确保内容是有效的JavaScript对象
    if (!cleanedContent.startsWith('{')) {
      throw new Error('Generated content is not a valid JavaScript object');
    }
    
    return cleanedContent;
  } catch (error) {
    log(`❌ Error generating configuration: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 读取现有的config.template.js文件
 */
function readTemplateFile() {
  const templatePath = path.join(__dirname, '../config.template.js');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error('config.template.js file not found');
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * 更新config.template.js文件
 */
function updateTemplateFile(newConfig) {
  const templatePath = path.join(__dirname, '../config.template.js');
  
  // 创建备份
  const backupPath = `${templatePath}.backup-${Date.now()}.js`;
  const currentContent = readTemplateFile();
  fs.writeFileSync(backupPath, currentContent);
  log(`📋 Created backup: ${path.basename(backupPath)}`, 'green');
  
  // 查找CURRENT_WEBSITE_CONTENT的位置
  const startPattern = /export const CURRENT_WEBSITE_CONTENT = \{/;
  const match = currentContent.match(startPattern);
  
  if (!match) {
    throw new Error('Could not find CURRENT_WEBSITE_CONTENT in template file');
  }
  
  const startIndex = match.index;
  
  // 找到对应的结束大括号
  let braceCount = 0;
  let endIndex = -1;
  let inString = false;
  let stringChar = '';
  
  for (let i = startIndex + match[0].length - 1; i < currentContent.length; i++) {
    const char = currentContent[i];
    const prevChar = i > 0 ? currentContent[i - 1] : '';
    
    // 处理字符串
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
  }
  
  if (endIndex === -1) {
    throw new Error('Could not find matching closing brace for CURRENT_WEBSITE_CONTENT');
  }
  
  // 构建新的内容
  const beforeContent = currentContent.substring(0, startIndex);
  const afterContent = currentContent.substring(endIndex);
  
  const newContent = `${beforeContent}export const CURRENT_WEBSITE_CONTENT = ${newConfig}${afterContent}`;
  
  // 写入文件
  fs.writeFileSync(templatePath, newContent);
  log(`✅ Successfully updated config.template.js`, 'green');
}

/**
 * 主函数
 */
async function main() {
  try {
    log('\n🚀 Theme Configuration Updater\n', 'bright');
    
    // 检查API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    
    // 读取配置
    log('📖 Reading config.txt...', 'blue');
    const themeInfo = readConfigFile();
    log(`  Theme: ${themeInfo.theme}`, 'cyan');
    log(`  Domain: ${themeInfo.domain}`, 'cyan');
    log(`  Site Name: ${themeInfo.siteName}`, 'cyan');
    
    // 生成新配置
    const newConfig = await generateThemeConfig(themeInfo);
    
    // 验证生成的配置
    log('🔍 Validating generated configuration...', 'blue');
    try {
      // 使用Function构造器来验证JavaScript语法
      new Function('return ' + newConfig);
      log('✅ Configuration is valid', 'green');
    } catch (error) {
      throw new Error(`Generated configuration has syntax errors: ${error.message}`);
    }
    
    // 更新文件
    log('📝 Updating config.template.js...', 'blue');
    updateTemplateFile(newConfig);
    
    // 提示后续步骤
    log('\n✨ Configuration updated successfully!', 'green');
    log('\n📌 Next steps:', 'yellow');
    log('1. Review the updated config.template.js file', 'yellow');
    log('2. Run "npm run sync-config-template" to apply changes', 'yellow');
    log('3. Restart the development server with "npm run dev"', 'yellow');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 运行主函数
main();