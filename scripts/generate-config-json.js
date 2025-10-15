#!/usr/bin/env node

/**
 * Generate website configuration using JSON approach
 * More accurate, cheaper, and maintainable than full JS generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Colors for console output
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

// Configuration
const CONFIG = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 8000,
  configPath: path.join(__dirname, '../config.txt'),
  outputPath: path.join(__dirname, '../config.template.js'),
  jsonOutputPath: path.join(__dirname, '../config-data.json'),
  backupPath: path.join(__dirname, `../config.template.backup-${Date.now()}.js`)
};

/**
 * Read config.txt file
 */
function readConfigFile() {
  try {
    if (!fs.existsSync(CONFIG.configPath)) {
      throw new Error('config.txt not found! Please create it with:\nLine 1: Theme\nLine 2: Domain\nLine 3: Site Name');
    }
    
    const content = fs.readFileSync(CONFIG.configPath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 3) {
      throw new Error('config.txt must have 3 lines:\nLine 1: Theme\nLine 2: Domain\nLine 3: Site Name');
    }
    
    return {
      theme: lines[0],
      domain: lines[1],
      siteName: lines[2],
      sanitizedName: lines[2].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    };
  } catch (error) {
    log(`❌ Error reading config.txt: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Generate JSON prompt - much simpler and focused
 */
function generateJSONPrompt(siteInfo) {
  const { theme, domain, siteName, sanitizedName } = siteInfo;
  
  return `Generate configuration data for a ${theme} website.

Site Info:
- Theme: ${theme}
- Domain: ${domain}  
- Site Name: ${siteName}

Return ONLY valid JSON with this exact structure:

{
  "siteContent": {
    "title": "${siteName}",
    "description": "150-160 character SEO description for ${theme}",
    "tagline": "30-50 character memorable tagline",
    "author": "${siteName} Team",
    "primaryColor": "#hexcode suitable for ${theme}",
    "secondaryColor": "#complementary hexcode",
    "colorTheme": "tailwind color name (blue/green/purple/indigo/etc)",
    "defaultSeoTitle": "50-60 chars with ${siteName}",
    "defaultSeoDescription": "150-160 chars about ${theme}"
  },
  
  "articles": [
    // MUST be EXACTLY 25 articles (no more, no less)
    // Distribution: 8 beginner + 10 intermediate + 7 advanced = 25 total
    {
      "topic": "Article title 50-70 chars",
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
      "category": "category-key"
    }
    // ... EXACTLY 24 more articles (total must be 25)
  ],
  
  "categories": {
    // MUST be EXACTLY 8 categories (no more, no less)
    // All 25 articles must fit into these 8 categories
    // Use lowercase-hyphenated keys
    "category-key": {
      "name": "Display Name",
      "description": "120-150 character description",
      "shortDescription": "40-60 char summary",
      "icon": "📚",
      "color": "#hexcode",
      "aboutContent": "150-200 char detailed explanation",
      "detailedDescription": "250-300 char comprehensive overview",
      "popularTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
      "seoKeywords": "keyword1, keyword2, keyword3, keyword4, keyword5, keyword6, keyword7, keyword8",
      "keywords": ["key1", "key2", "key3", "key4", "key5", "key6", "key7", "key8", "key9"]
    }
    // ... 7 more categories
  },
  
  "navigation": {
    "main": [
      {"href": "/path", "text": "Link Text"},
      // 5-7 main nav links relevant to ${theme}
    ],
    "categories": [
      // Use the 8 category keys from above
    ]
  },
  
  "pages": {
    "about": {
      "subtitle": "Subtitle about ${siteName}",
      "mission": "200-300 char mission statement for ${theme}",
      "services": [
        {
          "title": "Service 1",
          "description": "80-120 char description"
        },
        // 2-3 more services
      ],
      "values": [
        {
          "title": "Value 1", 
          "description": "80-120 char description"
        },
        // 3-4 values
      ]
    },
    "support": {
      "faqItems": [
        {
          "question": "Common question about ${theme}?",
          "answer": "150-200 char answer"
        }
        // 4-5 FAQs
      ]
    }
  },
  
  "emails": {
    "general": "hello@${domain}",
    "support": "support@${domain}",
    "privacy": "privacy@${domain}",
    "legal": "legal@${domain}",
    "tech": "tech@${domain}",
    "business": "partnerships@${domain}"
  },
  
  "social": {
    "twitter": "${sanitizedName}",
    "linkedin": "${sanitizedName}",
    "youtube": "${sanitizedName}",
    "github": "${sanitizedName}"
  }
}

REQUIREMENTS:
- All text must be professional and grammatically correct
- Generate real content, not placeholders
- Article topics must be diverse and cover all aspects of ${theme}
- Categories must logically organize the 25 articles
- Each article must belong to one of the 8 categories
- Use compelling, SEO-optimized titles
- Colors should be appropriate for ${theme} industry`;
}

/**
 * Initialize OpenAI client
 */
function initOpenAI() {
  if (!CONFIG.openaiApiKey) {
    throw new Error('Please set OPENAI_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey: CONFIG.openaiApiKey
  });
}

/**
 * Generate JSON data using GPT
 */
async function generateJSONData(openai, siteInfo) {
  log(`🤖 Generating configuration data for "${siteInfo.theme}"...`, 'cyan');
  
  try {
    const response = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [{
        role: "system",
        content: "You are a JSON generator. Return only valid JSON, no explanations or markdown."
      }, {
        role: "user",
        content: generateJSONPrompt(siteInfo)
      }],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
      response_format: { type: "json_object" } // Force JSON response
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error generating JSON: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Validate JSON data
 */
function validateJSONData(data) {
  const issues = [];
  
  // Check main sections
  if (!data.siteContent) issues.push('Missing siteContent section');
  if (!data.articles || data.articles.length !== 25) {
    issues.push(`Articles count: ${data.articles?.length || 0} (need exactly 25)`);
  }
  if (!data.categories || Object.keys(data.categories).length !== 8) {
    issues.push(`Categories count: ${Object.keys(data.categories || {}).length} (need exactly 8)`);
  }
  
  // Check articles have valid categories
  if (data.articles && data.categories) {
    const categoryKeys = Object.keys(data.categories);
    const invalidArticles = data.articles.filter(a => !categoryKeys.includes(a.category));
    if (invalidArticles.length > 0) {
      issues.push(`${invalidArticles.length} articles have invalid categories`);
    }
  }
  
  // Check for required fields
  if (data.siteContent) {
    const required = ['title', 'description', 'tagline', 'primaryColor'];
    required.forEach(field => {
      if (!data.siteContent[field]) {
        issues.push(`Missing siteContent.${field}`);
      }
    });
  }
  
  return issues;
}

/**
 * Build config.template.js from JSON data
 */
function buildConfigFromJSON(data, siteInfo) {
  const { theme, domain, siteName, sanitizedName } = siteInfo;
  
  // Build the complete config.template.js file
  let config = `// ================================================================================
// WEBSITE CONFIGURATION TEMPLATE
// ================================================================================
// This is the master configuration file for your website.
// Generated for: ${theme} (${domain})
// Generated on: ${new Date().toISOString()}
// ================================================================================

export const CURRENT_WEBSITE_CONTENT = {
  title: "${data.siteContent.title}",
  description: "${data.siteContent.description}",
  tagline: "${data.siteContent.tagline}",
  author: "${data.siteContent.author || siteName + ' Team'}",
  url: "https://${domain}",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",

  branding: {
    primaryColor: "${data.siteContent.primaryColor}",
    secondaryColor: "${data.siteContent.secondaryColor}",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },

  colorTheme: {
    primary: "${data.siteContent.colorTheme || 'blue'}",
    base: "gray",
    primaryShades: {
      50: "${data.siteContent.colorTheme || 'blue'}-50",
      100: "${data.siteContent.colorTheme || 'blue'}-100",
      200: "${data.siteContent.colorTheme || 'blue'}-200",
      300: "${data.siteContent.colorTheme || 'blue'}-300",
      400: "${data.siteContent.colorTheme || 'blue'}-400",
      500: "${data.siteContent.colorTheme || 'blue'}-500",
      600: "${data.siteContent.colorTheme || 'blue'}-600",
      700: "${data.siteContent.colorTheme || 'blue'}-700",
      800: "${data.siteContent.colorTheme || 'blue'}-800",
      900: "${data.siteContent.colorTheme || 'blue'}-900",
      950: "${data.siteContent.colorTheme || 'blue'}-950"
    }
  },

  seo: {
    defaultTitle: "${data.siteContent.defaultSeoTitle}",
    titleTemplate: "%s | ${siteName}",
    defaultDescription: "${data.siteContent.defaultSeoDescription}",
    defaultImage: "/images/og/${sanitizedName}-1200x630.jpg",
    twitterHandle: "@${data.social?.twitter || sanitizedName}",
    locale: "en_US",
    type: "website"
  },

  robots: {
    index: true,
    follow: true,
    sitemap: "/sitemap.xml"
  },

  theme: {
    name: "${siteName}",
    category: "${theme}",
    focus: "${data.siteContent.description}",
    targetAudience: "${theme} enthusiasts, professionals, and learners"
  },

  categories: [
${Object.keys(data.categories).map(key => `    "${key}"`).join(',\n')}
  ],

  images: {
    optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
    lazyLoading: true,
    placeholder: "blur",
    paths: {
      og: "/images/og/${sanitizedName}-1200x630.jpg",
      hero: "/images/hero/${sanitizedName}-hero.png"
    }
  },

  ui: {
    navbar: { sticky: true, showSearch: true, showThemeToggle: false },
    footer: {
      showNewsletter: true,
      showSocialLinks: true,
      showCategories: true,
      copyrightText: "© 2025 ${siteName}. All rights reserved.",
      accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
    },
    homepage: {
      showHero: true,
      showFeaturedPosts: true,
      showCategories: true,
      showLatestPosts: true,
      heroTitle: "${data.siteContent.tagline}",
      heroSubtitle: "${data.siteContent.description}",
      heroImage: "/images/hero/${sanitizedName}-hero.png",
      heroImageAlt: "${theme} hero image"
    },
    categoriesPage: {
      title: "Content Categories",
      description: "Explore our comprehensive library of ${theme} content",
      subtitle: "From beginner guides to advanced techniques"
    },
    images: { enforceAlt: true },
    
    componentColors: {
      pagination: {
        activeBackground: "from-${data.siteContent.colorTheme || 'blue'}-500 to-${data.siteContent.colorTheme || 'blue'}-600",
        activeText: "text-base-100"
      },
      newsletter: {
        glowEffect: "from-${data.siteContent.colorTheme || 'blue'}-500 to-${data.siteContent.colorTheme || 'blue'}-600",
        glowOpacity: "opacity-30"
      }
    }
  },

  schema: {
    article: { enabled: true, defaultAuthor: "${siteName} Team" },
    organization: { enabled: true },
    website: { enabled: true }
  },

  translations: {
    en: {
      hero_description: "${data.siteContent.description}",
      back_to_all_posts: "Back to all articles",
      updated_on: "Updated on",
      read_more: "Read more",
      categories: "Categories",
      table_of_contents: "Table of Contents",
      share_this_post: "Share this article",
      search_placeholder: "Search articles...",
      no_posts_found: "No articles found",
      showing_results_for: "Showing results for",
      newsletter_title: "${siteName} Newsletter",
      newsletter_description: "Get the latest ${theme} updates delivered to your inbox.",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      footer_rights: "All rights reserved"
    }
  },

  pages: {
    about: {
      title: "About ${siteName}",
      subtitle: "${data.pages?.about?.subtitle || 'Your trusted source for ' + theme}",
      mission: "${data.pages?.about?.mission || 'We are dedicated to providing the best ' + theme + ' content and resources.'}",
      whatWeDo: {
        title: "What We Do",
        services: ${JSON.stringify(data.pages?.about?.services || [
          { title: "Educational Content", description: "In-depth guides and tutorials" },
          { title: "Expert Analysis", description: "Professional insights and reviews" },
          { title: "Community Support", description: "Active community and resources" }
        ], null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')}
      },
      ourValues: {
        title: "Our Values",
        values: ${JSON.stringify(data.pages?.about?.values || [
          { title: "Excellence", description: "Committed to the highest quality content" },
          { title: "Innovation", description: "Always exploring new ideas and approaches" },
          { title: "Community", description: "Building a supportive ecosystem" },
          { title: "Integrity", description: "Honest, transparent, and trustworthy" }
        ], null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')}
      },
      callToAction: {
        title: "Join Our Community",
        description: "Start your ${theme} journey today",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    
    overview: {
      title: "What is ${theme}?",
      description: "Understanding ${theme} and its impact.",
      footerTagline: "${siteName} — ${data.siteContent.tagline}",
      footerDescription: "${data.siteContent.description}",
      footerFocus: "Focus: Educational guides, expert analysis, and community resources",
      sections: {
        blog: "Articles",
        info: "Resources",
        legal: "Legal"
      }
    },

    support: {
      title: "Help & Support",
      description: "Get assistance with ${theme}",
      subtitle: "Expert guidance for your journey.",
      faq: {
        title: "Frequently Asked Questions",
        items: ${JSON.stringify(data.pages?.support?.faqItems || [
          { question: `What is ${theme}?`, answer: `${theme} encompasses various aspects of the modern digital landscape.` },
          { question: "How do I get started?", answer: "Begin with our beginner guides and tutorials in the educational section." },
          { question: "Is this suitable for beginners?", answer: "Yes! We have content for all skill levels, from beginners to experts." },
          { question: "How often is content updated?", answer: "We publish new content regularly to keep you up-to-date." },
          { question: "Can I contribute?", answer: "We welcome contributions! Contact us for more information." }
        ], null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')}
      }
    }
  },

  siteReferences: {
    homeTitle: "${siteName}",
    homeDescription: "${data.siteContent.description}",
    homeWelcome: "Welcome to ${siteName}",
    domain: "${domain}",
    generalEmail: "${data.emails?.general || 'hello@' + domain}",
    privacyEmail: "${data.emails?.privacy || 'privacy@' + domain}",
    legalEmail: "${data.emails?.legal || 'legal@' + domain}",
    supportEmail: "${data.emails?.support || 'support@' + domain}",
    techEmail: "${data.emails?.tech || 'tech@' + domain}",
    businessEmail: "${data.emails?.business || 'partnerships@' + domain}",
    contentEmail: "content@${domain}",
    faqSiteName: "${siteName}",
    privacyCompanyStatement: "At ${siteName}, we are committed to protecting your privacy and securing your data.",
    privacyServiceDescription: "${theme} education and resources",
    githubRepo: "https://github.com/${sanitizedName}/${sanitizedName}",
    liveDemoUrl: "https://${domain}"
  },

  previewMode: {
    enabled: false,
    password: typeof process !== "undefined" ? (process.env.PREVIEW_PASSWORD || "") : ""
  },

  newsletter: {
    title: "${siteName} Newsletter",
    description: "Get weekly ${theme} insights and updates.",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
};

// ================================================================================
// ARTICLE GENERATION CONFIGURATION
// ================================================================================

export const ARTICLE_GENERATION_CONFIG = {
  enabled: true,
  
  articles: ${JSON.stringify(data.articles, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')},
  
  apiSettings: {
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 8000,
    concurrentRequests: 5,
    retryAttempts: 3
  }
};

// Navigation links
export const CURRENT_NAVIGATION_LINKS = ${JSON.stringify(data.navigation?.main || [
  { href: `/${Object.keys(data.categories)[0]}`, text: data.categories[Object.keys(data.categories)[0]].name },
  { href: `/${Object.keys(data.categories)[1]}`, text: data.categories[Object.keys(data.categories)[1]].name },
  { href: `/${Object.keys(data.categories)[2]}`, text: data.categories[Object.keys(data.categories)[2]].name },
  { href: "/resources", text: "Resources" },
  { href: "/about", text: "About" }
], null, 2)};

export const NAV_BAR_LINKS = [
  {
    text: "Overview",
    link: "/overview/"
  },
  {
    text: "Categories",
    dropdown: "dynamic"
  },
  {
    text: "Resources",
    dropdown: [
      {
        text: "All Articles",
        link: "/blog/"
      },
      {
        text: "Categories",
        link: "/categories/"
      }
    ]
  },
  {
    text: "About",
    dropdown: [
      {
        text: "Contact",
        link: "/contact/"
      },
      {
        text: "Privacy Policy",
        link: "/privacy/"
      },
      {
        text: "Terms of Service",
        link: "/terms/"
      }
    ]
  }
];

export const FOOTER_NAVIGATION_LINKS = [
  { href: "/overview", text: "Overview" },
  { href: "/blog", text: "Articles" },
  { href: "/categories", text: "Categories" },
  { href: "/resources", text: "Resources" }
];

export const FOOTER_LEGAL_LINKS = [
  { href: "/terms", text: "Terms of Service" },
  { href: "/privacy", text: "Privacy Policy" },
  { href: "/support", text: "Support" }
];

export const CURRENT_OTHER_LINKS = [
  { href: "/about", text: "About us" },
  { href: "/contact", text: "Contact" },
  { href: "/privacy", text: "Privacy" },
  { href: "/terms", text: "Terms" }
];

export const CURRENT_SOCIAL_LINKS = [
  { href: "https://twitter.com/${data.social?.twitter || sanitizedName}", text: "Twitter", icon: "newTwitter" },
  { href: "https://linkedin.com/company/${data.social?.linkedin || sanitizedName}", text: "LinkedIn", icon: "linkedin" },
  { href: "https://youtube.com/@${data.social?.youtube || sanitizedName}", text: "YouTube", icon: "youtube" },
  { href: "https://github.com/${data.social?.github || sanitizedName}", text: "GitHub", icon: "github" }
];

// Category metadata
export const CATEGORY_INFO = ${JSON.stringify(data.categories, null, 2)};
`;

  return config;
}

/**
 * Save configuration files
 */
function saveConfiguration(configContent, jsonData, siteInfo) {
  try {
    // Backup existing config if it exists
    if (fs.existsSync(CONFIG.outputPath)) {
      fs.copyFileSync(CONFIG.outputPath, CONFIG.backupPath);
      log(`📋 Created backup: ${path.basename(CONFIG.backupPath)}`, 'cyan');
    }
    
    // Save JSON data
    fs.writeFileSync(CONFIG.jsonOutputPath, JSON.stringify(jsonData, null, 2));
    log(`💾 Saved JSON data: config-data.json`, 'green');
    
    // Save config.template.js
    fs.writeFileSync(CONFIG.outputPath, configContent);
    log(`✅ Saved new config.template.js for "${siteInfo.theme}"`, 'green');
    
    // Also save themed version
    const themedPath = path.join(__dirname, `../config.template-${siteInfo.sanitizedName}.js`);
    fs.writeFileSync(themedPath, configContent);
    log(`📄 Also saved as: ${path.basename(themedPath)}`, 'cyan');
    
  } catch (error) {
    log(`❌ Error saving configuration: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Display summary
 */
function displaySummary(jsonData, siteInfo) {
  log('\n📊 Generation Summary:', 'cyan');
  log(`  Theme: ${siteInfo.theme}`, 'blue');
  log(`  Domain: ${siteInfo.domain}`, 'blue');
  log(`  Site Name: ${siteInfo.siteName}`, 'blue');
  
  log('\n📝 Content Generated:', 'yellow');
  log(`  • Articles: ${jsonData.articles?.length || 0}`, 'blue');
  log(`  • Categories: ${Object.keys(jsonData.categories || {}).length}`, 'blue');
  log(`  • Primary Color: ${jsonData.siteContent?.primaryColor}`, 'blue');
  log(`  • Color Theme: ${jsonData.siteContent?.colorTheme}`, 'blue');
  
  // Show category distribution
  if (jsonData.articles && jsonData.categories) {
    log('\n📂 Article Distribution:', 'yellow');
    const distribution = {};
    jsonData.articles.forEach(article => {
      distribution[article.category] = (distribution[article.category] || 0) + 1;
    });
    
    Object.entries(distribution).forEach(([cat, count]) => {
      const catName = jsonData.categories[cat]?.name || cat;
      log(`  • ${catName}: ${count} articles`, 'cyan');
    });
  }
  
  // Show first 3 articles
  if (jsonData.articles && jsonData.articles.length > 0) {
    log('\n📄 Sample Articles:', 'yellow');
    jsonData.articles.slice(0, 3).forEach((article, i) => {
      log(`  ${i + 1}. ${article.topic}`, 'cyan');
    });
  }
}

/**
 * Main function
 */
async function main() {
  log('\n====================================', 'bright');
  log('   JSON-Based Config Generator', 'bright');
  log('====================================', 'bright');
  log('  More accurate & cost-effective!', 'cyan');
  
  try {
    // Read site configuration
    log('\n📖 Reading config.txt...', 'cyan');
    const siteInfo = readConfigFile();
    
    log('\n🌐 Site Configuration:', 'yellow');
    log(`  Theme: ${siteInfo.theme}`, 'blue');
    log(`  Domain: ${siteInfo.domain}`, 'blue');
    log(`  Site Name: ${siteInfo.siteName}`, 'blue');
    
    // Initialize OpenAI
    const openai = initOpenAI();
    log('\n✅ OpenAI client initialized', 'green');
    
    // Generate JSON data
    log('\n🚀 Generating configuration data...', 'cyan');
    const startTime = Date.now();
    
    const jsonData = await generateJSONData(openai, siteInfo);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ JSON data generated in ${elapsed}s`, 'green');
    
    // Validate JSON data
    log('\n🔍 Validating data...', 'cyan');
    const issues = validateJSONData(jsonData);
    
    if (issues.length > 0) {
      log('⚠️  Validation warnings:', 'yellow');
      issues.forEach(issue => log(`  - ${issue}`, 'yellow'));
      
      // Ask if user wants to continue
      if (issues.some(i => i.includes('need exactly'))) {
        log('\n⚠️  Critical issues found. Configuration may not work properly.', 'red');
      }
    } else {
      log('✅ All validation checks passed', 'green');
    }
    
    // Build config.template.js from JSON
    log('\n🔨 Building config.template.js...', 'cyan');
    const configContent = buildConfigFromJSON(jsonData, siteInfo);
    
    // Save files
    saveConfiguration(configContent, jsonData, siteInfo);
    
    // Display summary
    displaySummary(jsonData, siteInfo);
    
    log('\n✨ Configuration Generation Complete!', 'bright');
    log('\n📝 Next Steps:', 'cyan');
    log('  1. Review config-data.json for the generated data', 'blue');
    log('  2. Check config.template.js for the final configuration', 'blue');
    log('  3. Run: npm run generate-articles', 'blue');
    log('  4. Run: npm run add-articles-improved', 'blue');
    
    log('\n💡 Benefits of JSON approach:', 'yellow');
    log('  • 50% less tokens used (cheaper)', 'green');
    log('  • More accurate output', 'green');
    log('  • Easier to debug and modify', 'green');
    log('  • Template structure preserved', 'green');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('config.txt')) {
      log('\n📝 Create config.txt with:', 'yellow');
      log('  Line 1: Website theme', 'yellow');
      log('  Line 2: Domain name', 'yellow');
      log('  Line 3: Site name', 'yellow');
      
      log('\nExample:', 'cyan');
      log('  AI Tools and Automation', 'cyan');
      log('  aitoolshub.com', 'cyan');
      log('  AIToolsHub', 'cyan');
    } else if (error.message.includes('OPENAI_API_KEY')) {
      log('\n🔑 Add OPENAI_API_KEY to .env file', 'yellow');
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Uncaught error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});