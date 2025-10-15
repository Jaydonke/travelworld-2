#!/usr/bin/env node

/**
 * 改进版主题配置更新脚本
 * 通过OpenAI API根据新主题生成完整的网站配置
 * 使用完整的模板结构确保生成的配置包含所有必要字段
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
 * 生成完整的配置模板
 */
function getCompleteTemplate() {
  return {
    title: "SITE_NAME",
    description: "SITE_DESCRIPTION",
    tagline: "SITE_TAGLINE",
    author: "SITE_NAME Team",
    url: "https://DOMAIN",
    locale: "en-US",
    dir: "ltr",
    charset: "UTF-8",
    basePath: "/",
    postsPerPage: 5,
    googleAnalyticsId: "",
    
    branding: {
      primaryColor: "#COLOR_CODE",
      secondaryColor: "#COLOR_CODE",
      surfaceColor: "#F9FAFB",
      fontFamily: "Inter, system-ui, sans-serif",
      logoUrl: "/images/logo.png",
      faviconUrl: "/favicon.ico"
    },
    
    colorTheme: {
      primary: "COLOR_NAME",
      base: "gray",
      primaryShades: {
        50: "COLOR-50",
        100: "COLOR-100",
        200: "COLOR-200",
        300: "COLOR-300",
        400: "COLOR-400",
        500: "COLOR-500",
        600: "COLOR-600",
        700: "COLOR-700",
        800: "COLOR-800",
        900: "COLOR-900",
        950: "COLOR-950"
      }
    },
    
    seo: {
      defaultTitle: "SITE_NAME - THEME",
      titleTemplate: "%s | SITE_NAME",
      defaultDescription: "SEO_DESCRIPTION",
      defaultImage: "/images/og/SITE_NAME_LOWER-1200x630.jpg",
      twitterHandle: "@SITE_NAME_LOWER",
      locale: "en_US",
      type: "website"
    },
    
    robots: {
      index: true,
      follow: true,
      sitemap: "/sitemap.xml"
    },
    
    theme: {
      name: "SITE_NAME",
      category: "THEME",
      focus: "THEME_FOCUS",
      targetAudience: "TARGET_AUDIENCE"
    },
    
    categories: ["CATEGORY_1", "CATEGORY_2", "CATEGORY_3"],
    
    images: {
      optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
      lazyLoading: true,
      placeholder: "blur",
      paths: {
        og: "/images/og/SITE_NAME_LOWER-1200x630.jpg",
        hero: "/images/hero/SITE_NAME_LOWER-hero.png"
      }
    },
    
    ui: {
      navbar: { sticky: true, showSearch: true, showThemeToggle: false },
      footer: {
        showNewsletter: true,
        showSocialLinks: true,
        showCategories: true,
        copyrightText: "© 2025 SITE_NAME. All rights reserved.",
        accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
      },
      homepage: {
        showHero: true,
        showFeaturedPosts: true,
        showCategories: true,
        showLatestPosts: true,
        heroTitle: "HERO_TITLE",
        heroSubtitle: "HERO_SUBTITLE",
        heroImage: "/images/hero/SITE_NAME_LOWER-hero.png",
        heroImageAlt: "HERO_ALT"
      },
      categoriesPage: {
        title: "Content Categories",
        description: "CATEGORIES_DESCRIPTION",
        subtitle: "CATEGORIES_SUBTITLE"
      },
      images: { enforceAlt: true },
      componentColors: {
        pagination: {
          activeBackground: "from-COLOR_NAME-500 to-COLOR_NAME-600",
          activeText: "text-base-100"
        },
        newsletter: {
          glowEffect: "from-COLOR_NAME-500 to-COLOR_NAME-600",
          glowOpacity: "opacity-30"
        }
      }
    },
    
    schema: {
      article: { enabled: true, defaultAuthor: "SITE_NAME Team" },
      organization: { enabled: true },
      website: { enabled: true }
    },
    
    translations: {
      en: {
        hero_description: "HERO_DESCRIPTION",
        back_to_all_posts: "Back to all articles",
        updated_on: "Updated on",
        read_more: "Read more",
        categories: "Categories",
        table_of_contents: "Table of Contents",
        share_this_post: "Share this article",
        search_placeholder: "Search articles...",
        no_posts_found: "No articles found",
        showing_results_for: "Showing results for",
        newsletter_title: "SITE_NAME Newsletter",
        newsletter_description: "NEWSLETTER_DESCRIPTION",
        newsletter_placeholder: "Enter your email",
        newsletter_button: "Subscribe",
        footer_rights: "All rights reserved"
      }
    },
    
    pages: {
      about: {
        title: "About SITE_NAME",
        subtitle: "ABOUT_SUBTITLE",
        mission: "ABOUT_MISSION",
        whatWeDo: {
          title: "What We Do",
          services: [
            { title: "SERVICE_1_TITLE", description: "SERVICE_1_DESC" },
            { title: "SERVICE_2_TITLE", description: "SERVICE_2_DESC" },
            { title: "SERVICE_3_TITLE", description: "SERVICE_3_DESC" }
          ]
        },
        ourValues: {
          title: "Our Values",
          values: [
            { title: "VALUE_1_TITLE", description: "VALUE_1_DESC" },
            { title: "VALUE_2_TITLE", description: "VALUE_2_DESC" },
            { title: "VALUE_3_TITLE", description: "VALUE_3_DESC" },
            { title: "VALUE_4_TITLE", description: "VALUE_4_DESC" }
          ]
        },
        callToAction: {
          title: "CTA_TITLE",
          description: "CTA_DESCRIPTION",
          buttonText: "Explore Resources",
          buttonLink: "/blog"
        }
      },
      
      overview: {
        title: "What is THEME?",
        description: "OVERVIEW_DESCRIPTION",
        footerTagline: "SITE_NAME — FOOTER_TAGLINE",
        footerDescription: "FOOTER_DESCRIPTION",
        footerFocus: "Focus: FOOTER_FOCUS",
        sections: {
          blog: "Articles",
          info: "Resources",
          legal: "Legal"
        }
      },
      
      support: {
        title: "Help & Support",
        description: "Get assistance with THEME",
        subtitle: "Expert guidance for your journey.",
        quickActions: [
          { text: "Contact Support", href: "#contact-channels", primary: true },
          { text: "Browse FAQ", href: "#faq", primary: false }
        ],
        categories: [
          {
            id: "getting-started",
            title: "Getting Started",
            description: "SUPPORT_CAT_1_DESC",
            email: "learn@DOMAIN",
            icon: "rocket"
          },
          {
            id: "content",
            title: "Content Questions",
            description: "SUPPORT_CAT_2_DESC",
            email: "content@DOMAIN",
            icon: "pencil"
          },
          {
            id: "community",
            title: "Community Support",
            description: "SUPPORT_CAT_3_DESC",
            email: "community@DOMAIN",
            icon: "users"
          },
          {
            id: "partnerships",
            title: "Partnerships & Press",
            description: "SUPPORT_CAT_4_DESC",
            email: "partnerships@DOMAIN",
            icon: "handshake"
          }
        ],
        contactChannels: {
          title: "Contact Channels",
          description: "Choose the best way to reach our team",
          channels: [
            {
              title: "General Support",
              description: "CHANNEL_1_DESC",
              detail: "Response within 24–48 hours",
              action: "support@DOMAIN"
            },
            {
              title: "Content Inquiries",
              description: "CHANNEL_2_DESC",
              detail: "Response within 2–3 business days",
              action: "content@DOMAIN"
            },
            {
              title: "Business & Partnerships",
              description: "CHANNEL_3_DESC",
              detail: "Response within 3–5 business days",
              action: "partnerships@DOMAIN"
            },
            {
              title: "Technical Issues",
              description: "CHANNEL_4_DESC",
              detail: "Response within 24 hours",
              action: "tech@DOMAIN"
            }
          ]
        },
        faq: {
          title: "Frequently Asked Questions",
          items: [
            { question: "FAQ_Q1", answer: "FAQ_A1" },
            { question: "FAQ_Q2", answer: "FAQ_A2" },
            { question: "FAQ_Q3", answer: "FAQ_A3" },
            { question: "FAQ_Q4", answer: "FAQ_A4" },
            { question: "FAQ_Q5", answer: "FAQ_A5" }
          ]
        }
      },
      
      terms: {
        title: "Terms of Service",
        description: "Terms and conditions for using SITE_NAME's website and services.",
        subtitle: "By using DOMAIN, you agree to these terms.",
        lastUpdated: "January 2025",
        introduction: "Welcome to SITE_NAME. These Terms of Service govern your access to and use of our website and services.",
        sections: [
          {
            id: "acceptance",
            title: "1. Acceptance of Terms",
            content: "By accessing and using SITE_NAME, you acknowledge that you have read, understood, and agree to be bound by these Terms."
          },
          {
            id: "use-of-content",
            title: "2. Use of Content",
            permittedUses: [
              "Personal, educational, and research use",
              "Sharing with attribution for non-commercial purposes",
              "Linking to our articles and resources"
            ],
            restrictions: [
              "Reproducing content without permission or attribution",
              "Using content for unlawful or fraudulent purposes",
              "Misrepresenting content as personal recommendations",
              "Scraping or automated bulk data extraction"
            ]
          },
          {
            id: "content-disclaimer",
            title: "3. Content Disclaimer",
            content: "CONTENT_DISCLAIMER"
          },
          {
            id: "user-conduct",
            title: "4. User Conduct",
            content: "You agree to act lawfully and respectfully. You must not:",
            prohibitions: [
              { title: "Violate Laws", description: "Use the service for any illegal purpose" },
              { title: "Mislead Others", description: "Provide false information or impersonate others" },
              { title: "Spread Malware", description: "Transmit viruses, malware, or other harmful code" },
              { title: "Unauthorized Access", description: "Attempt to gain unauthorized access to our systems" }
            ]
          },
          {
            id: "intellectual-property",
            title: "5. Intellectual Property",
            content: "All site content is owned by SITE_NAME or our content suppliers and is protected by copyright laws.",
            license: "Unless otherwise indicated, no license is granted; limited personal use only."
          },
          {
            id: "disclaimers",
            title: "6. Service Disclaimers",
            content: "The service is provided 'as is' and 'as available' without warranties of any kind."
          },
          {
            id: "limitation",
            title: "7. Limitation of Liability",
            content: "To the fullest extent permitted by law, SITE_NAME shall not be liable for any damages."
          },
          {
            id: "termination",
            title: "8. Termination",
            content: "We may suspend or terminate access immediately for any reason."
          },
          {
            id: "changes",
            title: "9. Changes to These Terms",
            content: "We may modify these Terms at any time. Continued use signifies acceptance."
          },
          {
            id: "contact",
            title: "10. Contact Information",
            content: "Questions about these Terms? Contact legal@DOMAIN."
          }
        ]
      },
      
      privacy: {
        title: "Privacy Policy",
        description: "Learn how SITE_NAME collects, uses, and protects your personal information.",
        subtitle: "Your privacy and data security are our priorities.",
        lastUpdated: "January 2025",
        introduction: "SITE_NAME is committed to protecting your privacy. This policy explains our data practices.",
        sections: [
          {
            id: "information-collect",
            title: "1. Information We Collect",
            subsections: [
              {
                title: "Information You Provide",
                content: "We collect information you provide directly to us, including when you:",
                items: [
                  "Subscribe to newsletters or create an account",
                  "Contact us via forms or email",
                  "Participate in community discussions",
                  "Submit feedback or report issues",
                  "Access premium content or services"
                ]
              },
              {
                title: "Automatically Collected Information",
                content: "When you visit our site, we automatically collect certain technical data:",
                items: [
                  "Device and browser information",
                  "IP address and approximate location",
                  "Pages viewed and interaction patterns",
                  "Referring URLs and search terms",
                  "Social media interactions (if connected)"
                ]
              }
            ]
          },
          {
            id: "how-we-use",
            title: "2. How We Use Your Information",
            content: "We use collected information to:",
            uses: [
              "Provide, maintain, and improve the site and services",
              "Send relevant updates about THEME",
              "Respond to inquiries and support requests",
              "Analyze usage patterns and user preferences",
              "Detect and prevent fraud or security issues",
              "Comply with legal and regulatory obligations"
            ]
          },
          {
            id: "information-sharing",
            title: "3. Information Sharing",
            content: "We do not sell or rent personal information. We may share information with trusted service providers."
          },
          {
            id: "data-security",
            title: "4. Data Security",
            content: "We implement industry-standard security measures to protect your personal information."
          },
          {
            id: "your-rights",
            title: "5. Your Rights",
            content: "You may request access, correction, deletion, or portability of your personal data."
          },
          {
            id: "cookies",
            title: "6. Cookies and Tracking",
            content: "We use cookies to enhance your experience. You may adjust cookie settings in your browser."
          },
          {
            id: "children",
            title: "7. Children's Privacy",
            content: "Our services are not directed to individuals under 13."
          },
          {
            id: "changes",
            title: "8. Changes to This Policy",
            content: "We may update this policy periodically and will post updates on this page."
          },
          {
            id: "contact",
            title: "9. Contact Us",
            content: "Questions about this policy? Contact privacy@DOMAIN."
          }
        ]
      }
    },
    
    siteReferences: {
      homeTitle: "SITE_NAME",
      homeDescription: "HOME_DESCRIPTION",
      homeWelcome: "Welcome to SITE_NAME",
      domain: "DOMAIN",
      generalEmail: "hello@DOMAIN",
      privacyEmail: "privacy@DOMAIN",
      legalEmail: "legal@DOMAIN",
      supportEmail: "support@DOMAIN",
      techEmail: "tech@DOMAIN",
      businessEmail: "partnerships@DOMAIN",
      contentEmail: "content@DOMAIN",
      faqSiteName: "SITE_NAME",
      privacyCompanyStatement: "At SITE_NAME, we are committed to protecting your privacy and securing your data.",
      privacyServiceDescription: "THEME education and resources",
      githubRepo: "https://github.com/SITE_NAME_LOWER/SITE_NAME_LOWER",
      liveDemoUrl: "https://DOMAIN"
    },
    
    previewMode: {
      enabled: false,
      password: ""
    },
    
    newsletter: {
      title: "SITE_NAME Newsletter",
      description: "Get weekly THEME insights and updates.",
      emailPlaceholder: "Enter your email",
      subscribeButton: "Subscribe",
      privacyNote: "We respect your privacy. Unsubscribe anytime."
    }
  };
}

/**
 * 生成系统提示
 */
function generateSystemPrompt(themeInfo, template) {
  return `You are a website configuration generator. You will receive a complete configuration template with placeholder values (like SITE_NAME, THEME, etc.) and you need to replace ALL placeholders with appropriate content for the given theme.

Theme Information:
- Theme: ${themeInfo.theme}
- Site Name: ${themeInfo.siteName}
- Domain: ${themeInfo.domain}

Instructions:
1. Replace ALL placeholders (anything in CAPS like SITE_NAME, THEME, etc.) with appropriate content
2. SITE_NAME should be replaced with "${themeInfo.siteName}"
3. SITE_NAME_LOWER should be replaced with "${themeInfo.siteName.toLowerCase()}"
4. DOMAIN should be replaced with "${themeInfo.domain}"
5. THEME should be replaced with "${themeInfo.theme}"
6. Generate appropriate descriptions, taglines, and content for the ${themeInfo.theme} theme
7. Choose an appropriate color scheme (use Tailwind color names like blue, orange, purple, green, etc.)
8. Create 8-12 relevant categories for ${themeInfo.theme} (lowercase with hyphens)
9. Generate appropriate FAQ questions and answers (5 items)
10. Create relevant service descriptions (3 items) and values (4 items)
11. Make all content specific to ${themeInfo.theme} and professional

Color Guidelines:
- Choose a color that fits the theme (e.g., blue for tech, green for nature, orange for entertainment)
- Use the color name consistently (e.g., if you choose "blue", use "blue-500", "blue-600", etc.)
- Replace COLOR_NAME with the chosen color name
- Replace COLOR_CODE with appropriate hex codes

Content Guidelines:
- Make all descriptions engaging and relevant to ${themeInfo.theme}
- FAQ should address common questions about ${themeInfo.theme}
- Services should reflect what a ${themeInfo.theme} website would offer
- Values should align with ${themeInfo.theme} industry standards

IMPORTANT: 
- Return ONLY the JavaScript object, no markdown, no explanations
- Maintain the EXACT structure of the template
- Do NOT remove any fields or change the structure
- Replace ALL placeholders with appropriate content`;
}

/**
 * 调用OpenAI API生成配置
 */
async function generateThemeConfig(themeInfo) {
  try {
    log(`🤖 Generating configuration for ${themeInfo.theme} theme...`, 'cyan');
    
    const template = getCompleteTemplate();
    const templateStr = JSON.stringify(template, null, 2);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: generateSystemPrompt(themeInfo, template)
        },
        {
          role: "user",
          content: `Here is the template to fill:\n\n${templateStr}\n\nReplace all placeholders with content appropriate for ${themeInfo.theme} theme.`
        }
      ],
      temperature: 0.7,
      max_tokens: 8000
    });
    
    const configStr = response.choices[0].message.content;
    
    // 清理响应（移除可能的markdown标记）
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
  
  // 验证pages部分的完整性
  const requiredPages = ['about', 'overview', 'support', 'terms', 'privacy'];
  const missingPages = requiredPages.filter(page => !config.pages[page]);
  
  if (missingPages.length > 0) {
    throw new Error(`Missing required pages: ${missingPages.join(', ')}`);
  }
  
  // 验证support部分的完整性
  if (!config.pages.support.quickActions || !config.pages.support.categories || 
      !config.pages.support.contactChannels || !config.pages.support.faq) {
    throw new Error('Support section is incomplete');
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
    log(`\n🚀 Improved Theme Configuration Updater`, 'bright');
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
    log(`✅ Configuration is valid and complete`, 'green');
    
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