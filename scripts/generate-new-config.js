#!/usr/bin/env node

/**
 * Generate complete config.template.js based on theme from config.txt
 * Reads: theme (line 1), domain (line 2), site name (line 3) from config.txt
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
  maxTokens: 16000, // Increased for full config generation
  configPath: path.join(__dirname, '../config.txt'),
  outputPath: path.join(__dirname, '../config.template.js'),
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
      siteName: lines[2]
    };
  } catch (error) {
    log(`❌ Error reading config.txt: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Read current config.template.js to get structure
 */
function getCurrentTemplateStructure() {
  try {
    const templatePath = path.join(__dirname, '../config.template.js');
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate template-based prompt for complete config generation
 */
function generateConfigPrompt(siteInfo) {
  const { theme, domain, siteName } = siteInfo;
  
  // Sanitize site name for handles
  const sanitizedSiteName = siteName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Create the pre-structured template with placeholders
  const template = `// ================================================================================
// WEBSITE CONFIGURATION TEMPLATE
// Generated for: ${theme} (${domain})
// ================================================================================

export const CURRENT_WEBSITE_CONTENT = {
  title: "${siteName}",
  description: "{{SITE_DESCRIPTION}}",
  tagline: "{{SITE_TAGLINE}}",
  author: "${siteName} Team",
  url: "https://${domain}",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",

  branding: {
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },

  colorTheme: {
    primary: "blue",
    base: "gray",
    primaryShades: {
      50: "blue-50",
      100: "blue-100",
      200: "blue-200",
      300: "blue-300",
      400: "blue-400",
      500: "blue-500",
      600: "blue-600",
      700: "blue-700",
      800: "blue-800",
      900: "blue-900",
      950: "blue-950"
    }
  },

  seo: {
    defaultTitle: "{{SEO_TITLE}}",
    titleTemplate: "%s | ${siteName}",
    defaultDescription: "{{SEO_DESCRIPTION}}",
    defaultImage: "/images/og/${sanitizedSiteName}-1200x630.jpg",
    twitterHandle: "@${sanitizedSiteName}",
    locale: "en_US",
    type: "website"
  },

  robots: { index: true, follow: true, sitemap: "/sitemap.xml" },

  theme: {
    name: "${siteName}",
    category: "${theme}",
    focus: "{{THEME_FOCUS}}",
    targetAudience: "{{TARGET_AUDIENCE}}"
  },

  categories: ["{{CAT1}}", "{{CAT2}}", "{{CAT3}}", "{{CAT4}}", "{{CAT5}}", "{{CAT6}}", "{{CAT7}}", "{{CAT8}}"],

  images: {
    optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
    lazyLoading: true,
    placeholder: "blur",
    paths: {
      og: "/images/og/${sanitizedSiteName}-1200x630.jpg",
      hero: "/images/hero/${sanitizedSiteName}-hero.png"
    }
  },

  ui: {
    navbar: { sticky: true, showSearch: true, showThemeToggle: false },
    footer: {
      showNewsletter: true, showSocialLinks: true, showCategories: true,
      copyrightText: "© 2025 ${siteName}. All rights reserved.",
      accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
    },
    homepage: {
      showHero: true, showFeaturedPosts: true, showCategories: true, showLatestPosts: true,
      heroTitle: "{{HERO_TITLE}}",
      heroSubtitle: "{{HERO_SUBTITLE}}",
      heroImage: "/images/hero/${sanitizedSiteName}-hero.png",
      heroImageAlt: "{{HERO_ALT}}"
    },
    categoriesPage: {
      title: "Content Categories",
      description: "{{CATEGORIES_DESCRIPTION}}",
      subtitle: "{{CATEGORIES_SUBTITLE}}"
    },
    images: { enforceAlt: true },
    componentColors: {
      pagination: {
        activeBackground: "from-blue-500 to-blue-600",
        activeText: "text-base-100"
      },
      newsletter: {
        glowEffect: "from-blue-500 to-blue-600",
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
      hero_description: "{{HERO_DESCRIPTION}}",
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
      newsletter_description: "{{NEWSLETTER_DESCRIPTION}}",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      footer_rights: "All rights reserved"
    }
  },

  pages: {
    about: {
      title: "About ${siteName}",
      subtitle: "Discover ${siteName}",
      mission: "{{MISSION_STATEMENT}}",
      whatWeDo: {
        title: "What We Do",
        services: [
          { title: "{{SERVICE1_TITLE}}", description: "{{SERVICE1_DESC}}" },
          { title: "{{SERVICE2_TITLE}}", description: "{{SERVICE2_DESC}}" },
          { title: "{{SERVICE3_TITLE}}", description: "{{SERVICE3_DESC}}" }
        ]
      },
      ourValues: {
        title: "Our Values",
        values: [
          { title: "{{VALUE1_TITLE}}", description: "{{VALUE1_DESC}}" },
          { title: "{{VALUE2_TITLE}}", description: "{{VALUE2_DESC}}" },
          { title: "{{VALUE3_TITLE}}", description: "{{VALUE3_DESC}}" },
          { title: "{{VALUE4_TITLE}}", description: "{{VALUE4_DESC}}" }
        ]
      },
      callToAction: {
        title: "Start Exploring",
        description: "Discover our comprehensive resources",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    overview: {
      title: "{{OVERVIEW_TITLE}}",
      description: "{{OVERVIEW_DESCRIPTION}}",
      footerTagline: "{{FOOTER_TAGLINE}}",
      footerDescription: "{{FOOTER_DESCRIPTION}}",
      footerFocus: "{{FOOTER_FOCUS}}",
      sections: { blog: "Articles", info: "Resources", legal: "Legal" }
    },
    support: {
      title: "Help & Support",
      description: "{{SUPPORT_DESCRIPTION}}",
      subtitle: "{{SUPPORT_SUBTITLE}}",
      faq: {
        title: "Frequently Asked Questions",
        items: [
          { question: "{{FAQ1_Q}}", answer: "{{FAQ1_A}}" },
          { question: "{{FAQ2_Q}}", answer: "{{FAQ2_A}}" },
          { question: "{{FAQ3_Q}}", answer: "{{FAQ3_A}}" },
          { question: "{{FAQ4_Q}}", answer: "{{FAQ4_A}}" },
          { question: "{{FAQ5_Q}}", answer: "{{FAQ5_A}}" }
        ]
      }
    }
  },

  siteReferences: {
    homeTitle: "${siteName}",
    homeDescription: "{{HOME_DESCRIPTION}}",
    homeWelcome: "Welcome to ${siteName}",
    domain: "${domain}",
    generalEmail: "hello@${domain}",
    privacyEmail: "privacy@${domain}",
    legalEmail: "legal@${domain}",
    supportEmail: "support@${domain}",
    techEmail: "tech@${domain}",
    businessEmail: "partnerships@${domain}",
    contentEmail: "content@${domain}",
    faqSiteName: "${siteName}",
    privacyCompanyStatement: "{{PRIVACY_STATEMENT}}",
    privacyServiceDescription: "{{PRIVACY_SERVICE_DESC}}",
    githubRepo: "https://github.com/${sanitizedSiteName}/${sanitizedSiteName}",
    liveDemoUrl: "https://${domain}"
  },

  previewMode: { enabled: false, password: "" },

  newsletter: {
    title: "${siteName} Newsletter",
    description: "{{NEWSLETTER_MAIN_DESC}}",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
};

export const ARTICLE_GENERATION_CONFIG = {
  enabled: true,
  articles: [
{{ARTICLES_ARRAY}}
  ],
  apiSettings: {
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 8000,
    concurrentRequests: 5,
    retryAttempts: 3
  }
};

export const CURRENT_NAVIGATION_LINKS = [
  { href: "/about", text: "About Us" },
  { href: "/categories", text: "Categories" },
  { href: "/blog", text: "Articles" },
  { href: "/contact", text: "Contact" },
  { href: "/support", text: "Support" },
  { href: "/privacy", text: "Privacy" }
];

export const NAV_BAR_LINKS = [
  { text: "Overview", link: "/overview/" },
  { text: "Categories", dropdown: "dynamic" },
  {
    text: "Resources",
    dropdown: [
      { text: "All Articles", link: "/blog/" },
      { text: "Categories", link: "/categories/" }
    ]
  },
  {
    text: "About",
    dropdown: [
      { text: "Contact", link: "/contact/" },
      { text: "Privacy Policy", link: "/privacy/" },
      { text: "Terms of Service", link: "/terms/" }
    ]
  }
];

export const FOOTER_NAVIGATION_LINKS = [
  { href: "/about", text: "About" },
  { href: "/blog", text: "Blog" },
  { href: "/categories", text: "Categories" },
  { href: "/contact", text: "Contact" }
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
  { href: "https://twitter.com/${sanitizedSiteName}", text: "Twitter", icon: "newTwitter" },
  { href: "https://linkedin.com/company/${sanitizedSiteName}", text: "LinkedIn", icon: "linkedin" },
  { href: "https://youtube.com/@${sanitizedSiteName}", text: "YouTube", icon: "youtube" },
  { href: "https://github.com/${sanitizedSiteName}", text: "GitHub", icon: "github" }
];

export const CATEGORY_INFO = {
{{CATEGORY_INFO_CONTENT}}
};`;
  
  return `You are a JavaScript configuration content generator. Your job is to ONLY replace placeholders in a pre-structured template.

⚠️ CRITICAL RULES:
1. You will ONLY replace text between {{}} markers
2. You will NEVER modify the JavaScript structure
3. You will NEVER add quotes to boolean or number values
4. You will NEVER change anything outside of {{}} placeholders
5. The template already has PERFECT JavaScript syntax - DO NOT MODIFY IT

INSTRUCTIONS:
Replace ALL placeholders with appropriate content for:
- Theme: ${theme}
- Domain: ${domain}
- Site Name: ${siteName}

PLACEHOLDERS TO REPLACE:

🚨 ABSOLUTE REQUIREMENTS - READ 3 TIMES BEFORE PROCEEDING:

RULE #1 - BOOLEANS ARE NEVER QUOTED
❌ WRONG: enabled: "true"    
✅ RIGHT: enabled: true
❌ WRONG: follow: "false"
✅ RIGHT: follow: false
MEMORIZE: true and false are JAVASCRIPT KEYWORDS, not strings!

RULE #2 - NUMBERS ARE NEVER QUOTED  
❌ WRONG: temperature: "0.7"
✅ RIGHT: temperature: 0.7
❌ WRONG: quality: "85"
✅ RIGHT: quality: 85
MEMORIZE: Numbers in JavaScript don't have quotes!

RULE #3 - ARRAYS MUST BE ARRAYS, NOT STRINGS
❌ WRONG: services: "some text here"
✅ RIGHT: services: [
  { title: "Expert Guides", description: "Comprehensive tutorials from professionals" },
  { title: "Resources", description: "Curated content and tools for all levels" },
  { title: "Updates", description: "Latest trends and insights in the field" }
]

⚡ MENTAL CHECKPOINT - Before you start, confirm to yourself:
1. "I will write true not 'true' or "true""
2. "I will write 0.7 not '0.7' or "0.7""
3. "I will write arrays as [...] not as strings"
4. "Every comma is critical - missing commas break JavaScript"
5. "I am generating JavaScript, not JSON - the rules are different"

🎯 PRE-GENERATION VALIDATION STEPS:
Step 1: When you see a boolean property, STOP and think: "No quotes on true/false"
Step 2: When you see a number property, STOP and think: "No quotes on numbers"
Step 3: When you see services/values/items, STOP and think: "This is an array of objects"
Step 4: After each property, STOP and think: "Did I add a comma?"

🔴 CRITICAL PATTERNS TO MEMORIZE:

BOOLEAN PATTERN (burn this into memory):
enabled: true,
follow: false,
sticky: true,
showSearch: false,
lazyLoading: true,
showNewsletter: true,
showSocialLinks: true,
showCategories: true,
index: true,
enforceAlt: true,

NUMBER PATTERN (burn this into memory):
temperature: 0.7,
maxTokens: 8000,
postsPerPage: 5,
quality: 85,
concurrentRequests: 5,
retryAttempts: 3,

ARRAY PATTERN (exactly 3 services):
services: [
  { title: "Expert Guides", description: "Comprehensive tutorials from professionals" },
  { title: "Resources", description: "Curated content and tools for all levels" },
  { title: "Updates", description: "Latest trends and insights in the field" }
],

ARRAY PATTERN (exactly 4 values):
values: [
  { title: "Excellence", description: "Committed to highest quality content" },
  { title: "Innovation", description: "Pioneering new educational approaches" },
  { title: "Community", description: "Building supportive networks" },
  { title: "Integrity", description: "Providing accurate information" }
],

ARRAY PATTERN (exactly 5 items):
items: [
  { question: "How often is content updated?", answer: "We publish new content weekly" },
  { question: "Is content free?", answer: "Yes, all resources are freely available" },
  { question: "Can I contribute?", answer: "We welcome guest contributions" },
  { question: "How to stay updated?", answer: "Subscribe to our newsletter" },
  { question: "Who creates content?", answer: "Experienced professionals create our content" }
],

⛔ SELF-CHECK PROTOCOL - Apply to EVERY property you write:
1. Is this a boolean (true/false)? → NO QUOTES
2. Is this a number? → NO QUOTES  
3. Is this services/values/items? → MUST BE ARRAY
4. Did I add a comma after this property? → YES (except last)
5. Am I about to write "true" with quotes? → STOP! Remove quotes!
6. Am I about to write "0.7" with quotes? → STOP! Remove quotes!

🧠 PSYCHOLOGICAL REINFORCEMENT:
- Quoted booleans = BROKEN CODE = FAILURE
- Quoted numbers = BROKEN CODE = FAILURE  
- String instead of array = BROKEN CODE = FAILURE
- Missing comma = BROKEN CODE = FAILURE
- Success requires PERFECT SYNTAX = Follow rules EXACTLY

📋 FINAL MENTAL CHECKLIST (read each line slowly):
□ I understand true and false never have quotes
□ I understand numbers never have quotes
□ I understand services is always an array with 3 objects
□ I understand values is always an array with 4 objects
□ I understand items is always an array with 5 objects
□ I will add commas after every property except the last
□ I will generate valid JavaScript that can be executed

INPUT DATA:
Theme: ${theme}
Domain: ${domain}
Site Name: ${siteName}

NOW GENERATE THIS EXACT STRUCTURE (REMEMBER ALL RULES ABOVE):

// ================================================================================
// WEBSITE CONFIGURATION TEMPLATE  
// ================================================================================
// Generated for: ${theme} (${domain})
// ================================================================================

export const CURRENT_WEBSITE_CONTENT = {
  title: "${siteName}",
  description: "YOUR_REAL_150_CHAR_DESCRIPTION_HERE",
  tagline: "YOUR_REAL_TAGLINE_HERE",
  author: "${siteName} Team",
  url: "https://${domain}",
  locale: "en-US",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 5,
  googleAnalyticsId: "",

  branding: {
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    surfaceColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
    logoUrl: "/images/logo.png",
    faviconUrl: "/favicon.ico"
  },

  colorTheme: {
    primary: "blue",
    base: "gray",
    primaryShades: {
      50: "blue-50",
      100: "blue-100",
      200: "blue-200",
      300: "blue-300",
      400: "blue-400",
      500: "blue-500",
      600: "blue-600",
      700: "blue-700",
      800: "blue-800",
      900: "blue-900",
      950: "blue-950"
    }
  },

  seo: {
    defaultTitle: "YOUR_REAL_TITLE_HERE",
    titleTemplate: "%s | ${siteName}",
    defaultDescription: "YOUR_REAL_DESCRIPTION_HERE",
    defaultImage: "/images/og/${sanitizedSiteName}-1200x630.jpg",
    twitterHandle: "@${sanitizedSiteName}",
    locale: "en_US",
    type: "website"
  },

  robots: { index: true, follow: true, sitemap: "/sitemap.xml" },

  theme: {
    name: "${siteName}",
    category: "${theme}",
    focus: "YOUR_REAL_FOCUS_DESCRIPTION",
    targetAudience: "YOUR_REAL_AUDIENCE"
  },

  categories: ["category1", "category2", "category3", "category4", "category5", "category6", "category7", "category8"],

  images: {
    optimization: { enabled: true, quality: 85, formats: ["webp", "avif"] },
    lazyLoading: true,
    placeholder: "blur",
    paths: {
      og: "/images/og/${sanitizedSiteName}-1200x630.jpg",
      hero: "/images/hero/${sanitizedSiteName}-hero.png"
    }
  },

  ui: {
    navbar: { sticky: true, showSearch: true, showThemeToggle: false },
    footer: {
      showNewsletter: true, showSocialLinks: true, showCategories: true,
      copyrightText: "© 2025 ${siteName}. All rights reserved.",
      accessibilityNote: "Images include descriptive alt text; emoji have accessible labels."
    },
    homepage: {
      showHero: true, showFeaturedPosts: true, showCategories: true, showLatestPosts: true,
      heroTitle: "YOUR_REAL_HERO_TITLE",
      heroSubtitle: "YOUR_REAL_HERO_SUBTITLE",
      heroImage: "/images/hero/${sanitizedSiteName}-hero.png",
      heroImageAlt: "YOUR_REAL_ALT_TEXT"
    },
    categoriesPage: {
      title: "Content Categories",
      description: "YOUR_REAL_DESCRIPTION",
      subtitle: "YOUR_REAL_SUBTITLE"
    },
    images: { enforceAlt: true },
    componentColors: {
      pagination: {
        activeBackground: "from-blue-500 to-blue-600",
        activeText: "text-base-100"
      },
      newsletter: {
        glowEffect: "from-blue-500 to-blue-600",
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
      hero_description: "YOUR_REAL_HERO_DESCRIPTION",
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
      newsletter_description: "YOUR_REAL_NEWSLETTER_DESCRIPTION",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      footer_rights: "All rights reserved"
    }
  },

  pages: {
    about: {
      title: "About ${siteName}",
      subtitle: "Discover ${siteName}",
      mission: "YOUR_REAL_MISSION_STATEMENT_HERE",
      whatWeDo: {
        title: "What We Do",
        services: [
          { title: "Expert Guides", description: "Comprehensive tutorials from professionals" },
          { title: "Resources", description: "Curated content and tools for all levels" },
          { title: "Updates", description: "Latest trends and insights in the field" }
        ]
      },
      ourValues: {
        title: "Our Values",
        values: [
          { title: "Excellence", description: "Committed to highest quality content" },
          { title: "Innovation", description: "Pioneering new educational approaches" },
          { title: "Community", description: "Building supportive networks" },
          { title: "Integrity", description: "Providing accurate information" }
        ]
      },
      callToAction: {
        title: "Start Exploring",
        description: "Discover our comprehensive resources",
        buttonText: "Explore Resources",
        buttonLink: "/blog"
      }
    },
    overview: {
      title: "YOUR_REAL_OVERVIEW_TITLE",
      description: "YOUR_REAL_OVERVIEW_DESCRIPTION",
      footerTagline: "YOUR_REAL_FOOTER_TAGLINE",
      footerDescription: "YOUR_REAL_FOOTER_DESCRIPTION",
      footerFocus: "YOUR_REAL_FOOTER_FOCUS",
      sections: { blog: "Articles", info: "Resources", legal: "Legal" }
    },
    support: {
      title: "Help & Support",
      description: "YOUR_REAL_SUPPORT_DESCRIPTION",
      subtitle: "YOUR_REAL_SUPPORT_SUBTITLE",
      faq: {
        title: "Frequently Asked Questions",
        items: [
          { question: "How often is content updated?", answer: "We publish new content weekly" },
          { question: "Is content free?", answer: "Yes, all resources are freely available" },
          { question: "Can I contribute?", answer: "We welcome guest contributions" },
          { question: "How to stay updated?", answer: "Subscribe to our newsletter" },
          { question: "Who creates content?", answer: "Experienced professionals create our content" }
        ]
      }
    }
  },

  siteReferences: {
    homeTitle: "${siteName}",
    homeDescription: "YOUR_REAL_HOME_DESCRIPTION",
    homeWelcome: "Welcome to ${siteName}",
    domain: "${domain}",
    generalEmail: "hello@${domain}",
    privacyEmail: "privacy@${domain}",
    legalEmail: "legal@${domain}",
    supportEmail: "support@${domain}",
    techEmail: "tech@${domain}",
    businessEmail: "partnerships@${domain}",
    contentEmail: "content@${domain}",
    faqSiteName: "${siteName}",
    privacyCompanyStatement: "YOUR_REAL_PRIVACY_STATEMENT",
    privacyServiceDescription: "YOUR_REAL_SERVICE_DESCRIPTION",
    githubRepo: "https://github.com/${sanitizedSiteName}/${sanitizedSiteName}",
    liveDemoUrl: "https://${domain}"
  },

  previewMode: { enabled: false, password: "" },

  newsletter: {
    title: "${siteName} Newsletter",
    description: "YOUR_REAL_NEWSLETTER_DESCRIPTION",
    emailPlaceholder: "Enter your email",
    subscribeButton: "Subscribe",
    privacyNote: "We respect your privacy. Unsubscribe anytime."
  }
};

export const ARTICLE_GENERATION_CONFIG = {
  enabled: true,
  articles: [
    { topic: "Article Title 1", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category1" },
    { topic: "Article Title 2", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category1" },
    { topic: "Article Title 3", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category1" },
    { topic: "Article Title 4", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category2" },
    { topic: "Article Title 5", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category2" },
    { topic: "Article Title 6", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category2" },
    { topic: "Article Title 7", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category3" },
    { topic: "Article Title 8", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category3" },
    { topic: "Article Title 9", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category3" },
    { topic: "Article Title 10", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category4" },
    { topic: "Article Title 11", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category4" },
    { topic: "Article Title 12", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category4" },
    { topic: "Article Title 13", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category5" },
    { topic: "Article Title 14", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category5" },
    { topic: "Article Title 15", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category5" },
    { topic: "Article Title 16", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category6" },
    { topic: "Article Title 17", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category6" },
    { topic: "Article Title 18", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category6" },
    { topic: "Article Title 19", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category7" },
    { topic: "Article Title 20", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category7" },
    { topic: "Article Title 21", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category7" },
    { topic: "Article Title 22", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category8" },
    { topic: "Article Title 23", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category8" },
    { topic: "Article Title 24", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category8" },
    { topic: "Article Title 25", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "category8" }
  ],
  apiSettings: {
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 8000,
    concurrentRequests: 5,
    retryAttempts: 3
  }
};

export const CURRENT_NAVIGATION_LINKS = [
  { href: "/about", text: "About Us" },
  { href: "/categories", text: "Categories" },
  { href: "/blog", text: "Articles" },
  { href: "/contact", text: "Contact" },
  { href: "/support", text: "Support" },
  { href: "/privacy", text: "Privacy" }
];

export const NAV_BAR_LINKS = [
  { text: "Overview", link: "/overview/" },
  { text: "Categories", dropdown: "dynamic" },
  {
    text: "Resources",
    dropdown: [
      { text: "All Articles", link: "/blog/" },
      { text: "Categories", link: "/categories/" }
    ]
  },
  {
    text: "About",
    dropdown: [
      { text: "Contact", link: "/contact/" },
      { text: "Privacy Policy", link: "/privacy/" },
      { text: "Terms of Service", link: "/terms/" }
    ]
  }
];

export const FOOTER_NAVIGATION_LINKS = [
  { href: "/about", text: "About" },
  { href: "/blog", text: "Blog" },
  { href: "/categories", text: "Categories" },
  { href: "/contact", text: "Contact" }
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
  { href: "https://twitter.com/${sanitizedSiteName}", text: "Twitter", icon: "newTwitter" },
  { href: "https://linkedin.com/company/${sanitizedSiteName}", text: "LinkedIn", icon: "linkedin" },
  { href: "https://youtube.com/@${sanitizedSiteName}", text: "YouTube", icon: "youtube" },
  { href: "https://github.com/${sanitizedSiteName}", text: "GitHub", icon: "github" }
];

export const CATEGORY_INFO = {
  "category1": {
    name: "Category 1",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "📚",
    color: "#3B82F6",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category2": {
    name: "Category 2",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "🎯",
    color: "#8B5CF6",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category3": {
    name: "Category 3",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "💡",
    color: "#10B981",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category4": {
    name: "Category 4",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "🚀",
    color: "#F59E0B",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category5": {
    name: "Category 5",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "🎨",
    color: "#EF4444",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category6": {
    name: "Category 6",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "🔧",
    color: "#6366F1",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category7": {
    name: "Category 7",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "📊",
    color: "#14B8A6",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  },
  "category8": {
    name: "Category 8",
    description: "YOUR_REAL_DESCRIPTION",
    shortDescription: "YOUR_SHORT_DESCRIPTION",
    icon: "🌟",
    color: "#EC4899",
    aboutContent: "YOUR_ABOUT_CONTENT",
    detailedDescription: "YOUR_DETAILED_DESCRIPTION",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  }
};

CRITICAL INSTRUCTIONS:
1. Replace ALL "YOUR_REAL_*" placeholders with actual content relevant to ${theme}
2. Keep the exact structure shown above - DO NOT change array formats
3. Ensure category1-category8 match real category names for ${theme}
4. All 25 articles must use valid category keys from CATEGORY_INFO
5. NEVER write: enabled: "true" - always write: enabled: true
6. NEVER write: temperature: "0.7" - always write: temperature: 0.7
7. services MUST be an array with 3 objects (title & description)
8. values MUST be an array with 4 objects (title & description)
9. faq.items MUST be an array with 5 objects (question & answer)

FINAL OUTPUT REQUIREMENTS:
- Generate valid JavaScript with NO syntax errors
- All placeholders replaced with real ${theme} content
- Exactly 8 categories throughout
- Exactly 25 articles distributed across categories
- All boolean and numeric values unquoted
- All arrays properly formatted as shown above

Remember: Copy the EXACT structure above, just replace placeholders with real content for ${theme}.`;
}

/**
 * Post-process content to replace any remaining placeholders
 */
function postProcessPlaceholders(content, siteInfo) {
  const { theme, domain, siteName } = siteInfo;
  const sanitizedSiteName = siteName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Replace common placeholder patterns with fallback values
  const replacements = [
    // YOUR_REAL_* placeholders
    { pattern: /YOUR_REAL_150_CHAR_DESCRIPTION_HERE/g, replacement: `Discover ${theme} insights, tutorials, and expert analysis at ${siteName}. Your comprehensive resource for ${theme.toLowerCase()} content and community.` },
    { pattern: /YOUR_REAL_TAGLINE_HERE/g, replacement: `Your ${theme} resource hub` },
    { pattern: /YOUR_REAL_TITLE_HERE/g, replacement: `${siteName}: ${theme} Hub` },
    { pattern: /YOUR_REAL_DESCRIPTION_HERE/g, replacement: `Explore ${theme} with comprehensive guides and expert insights.` },
    { pattern: /YOUR_REAL_HERO_TITLE/g, replacement: `Welcome to ${siteName}` },
    { pattern: /YOUR_REAL_HERO_SUBTITLE/g, replacement: `Your ultimate ${theme.toLowerCase()} resource` },
    { pattern: /YOUR_REAL_ALT_TEXT/g, replacement: `${siteName} hero image` },
    { pattern: /YOUR_REAL_HERO_DESCRIPTION/g, replacement: `Discover everything about ${theme.toLowerCase()} with expert guides and insights.` },
    { pattern: /YOUR_REAL_NEWSLETTER_DESCRIPTION/g, replacement: `Get the latest ${theme.toLowerCase()} updates and insights delivered to your inbox.` },
    { pattern: /YOUR_REAL_MISSION_STATEMENT_HERE/g, replacement: `We are dedicated to providing comprehensive ${theme.toLowerCase()} resources, expert insights, and community support.` },
    { pattern: /YOUR_REAL_OVERVIEW_TITLE/g, replacement: `${theme} Overview` },
    { pattern: /YOUR_REAL_OVERVIEW_DESCRIPTION/g, replacement: `Comprehensive ${theme.toLowerCase()} resources and insights` },
    { pattern: /YOUR_REAL_FOOTER_TAGLINE/g, replacement: `Your trusted ${theme.toLowerCase()} resource` },
    { pattern: /YOUR_REAL_FOOTER_DESCRIPTION/g, replacement: `Explore our comprehensive collection of ${theme.toLowerCase()} guides, tutorials, and expert insights to enhance your knowledge.` },
    { pattern: /YOUR_REAL_FOOTER_FOCUS/g, replacement: `Focused on delivering quality ${theme.toLowerCase()} content` },
    { pattern: /YOUR_REAL_SUPPORT_DESCRIPTION/g, replacement: `Get help with ${theme.toLowerCase()} topics` },
    { pattern: /YOUR_REAL_SUPPORT_SUBTITLE/g, replacement: `We're here to help` },
    { pattern: /YOUR_REAL_HOME_DESCRIPTION/g, replacement: `Welcome to ${siteName}, your comprehensive resource for ${theme.toLowerCase()} content, guides, and expert insights.` },
    { pattern: /YOUR_REAL_PRIVACY_STATEMENT/g, replacement: `At ${siteName}, we are committed to protecting your privacy and securing your personal information.` },
    { pattern: /YOUR_REAL_SERVICE_DESCRIPTION/g, replacement: `${theme} education and resources` },
    { pattern: /YOUR_REAL_FOCUS_DESCRIPTION/g, replacement: `Comprehensive ${theme.toLowerCase()} content and resources` },
    { pattern: /YOUR_REAL_AUDIENCE/g, replacement: `${theme} enthusiasts and professionals` },
    { pattern: /YOUR_REAL_ABOUT_CONTENT/g, replacement: `Explore comprehensive ${theme.toLowerCase()} content with expert insights and practical guides.` },
    { pattern: /YOUR_REAL_DETAILED_DESCRIPTION/g, replacement: `Our ${theme.toLowerCase()} resources cover everything from beginner basics to advanced techniques, providing valuable insights for all skill levels.` },
    { pattern: /YOUR_SHORT_DESCRIPTION/g, replacement: `Essential ${theme.toLowerCase()} resources` },
    
    // Generic content placeholders (legacy)
    { pattern: /\[150-160 char SEO description[^\]]*\]/gi, replacement: `Discover ${theme} insights, tutorials, and expert analysis at ${siteName}. Your comprehensive resource for ${theme.toLowerCase()} content and community.` },
    { pattern: /\[30-50 char memorable tagline[^\]]*\]/gi, replacement: `Your ${theme} resource hub` },
    { pattern: /\[50-60 char title[^\]]*\]/gi, replacement: `${siteName}: ${theme} Hub` },
    { pattern: /\[150-160 char description[^\]]*\]/gi, replacement: `Explore ${theme} with comprehensive guides, expert insights, and community resources at ${siteName}.` },
    { pattern: /\[hero title[^\]]*\]/gi, replacement: `Welcome to ${siteName}` },
    { pattern: /\[hero subtitle[^\]]*\]/gi, replacement: `Your ultimate ${theme.toLowerCase()} resource` },
    { pattern: /\[hero description[^\]]*\]/gi, replacement: `Discover everything about ${theme.toLowerCase()} with expert guides and insights.` },
    { pattern: /\[newsletter description[^\]]*\]/gi, replacement: `Get the latest ${theme.toLowerCase()} updates and insights delivered to your inbox.` },
    
    // Theme-based color fallbacks
    { pattern: /\[hex color for[^\]]*\]/gi, replacement: '#3B82F6' },
    { pattern: /\[complementary hex color[^\]]*\]/gi, replacement: '#8B5CF6' },
    { pattern: /\[tailwind color name[^\]]*\]/gi, replacement: 'blue' },
    
    // FAQ and service placeholders
    { pattern: /\[FAQ \d+ question[^\]]*\]/gi, replacement: `How can I learn more about ${theme.toLowerCase()}?` },
    { pattern: /\[50-100 char answer[^\]]*\]/gi, replacement: `Browse our comprehensive guides and tutorials.` },
    { pattern: /\[service \d+[^\]]*\]/gi, replacement: `${theme} Resources` },
    { pattern: /\[50-70 char description[^\]]*\]/gi, replacement: `Expert content and community resources.` },
    { pattern: /\[value \d+[^\]]*\]/gi, replacement: 'Excellence' },
    
    // Generic descriptions
    { pattern: /\[[^\]]*description[^\]]*\]/gi, replacement: `Professional ${theme.toLowerCase()} content and resources.` },
    { pattern: /\[[^\]]*char[s]?[^\]]*\]/gi, replacement: `${theme} insights and resources.` },
    
    // Domain and email patterns
    { pattern: /\[privacy statement[^\]]*\]/gi, replacement: `At ${siteName}, we are committed to protecting your privacy and securing your personal information.` },
    { pattern: /\[service description[^\]]*\]/gi, replacement: `${theme} education and resources` }
  ];
  
  let processedContent = content;
  
  // Apply all replacements
  replacements.forEach(({ pattern, replacement }) => {
    processedContent = processedContent.replace(pattern, replacement);
  });
  
  // Fix common structural issues
  processedContent = processedContent.replace(/primaryShades: \{[^}]*\}/g, `primaryShades: {
      50: "blue-50",
      100: "blue-100", 
      200: "blue-200",
      300: "blue-300",
      400: "blue-400",
      500: "blue-500",
      600: "blue-600",
      700: "blue-700",
      800: "blue-800",
      900: "blue-900",
      950: "blue-950"
    }`);
  
  // Fix arrays that contain placeholder text instead of proper values
  // Look for patterns like: popularTopics: "Entertainment & Pop Culture insights and resources"
  processedContent = processedContent.replace(
    /popularTopics:\s*"[^"]+"/g,
    'popularTopics: ["trending", "featured", "latest", "popular", "must-read"]'
  );
  
  // Fix services array if it's a string instead of array
  processedContent = processedContent.replace(
    /services:\s*"[^"]+"/g,
    `services: [
          { title: "Expert ${theme} Guides", description: "Comprehensive tutorials and guides from industry experts" },
          { title: "Community Resources", description: "Curated ${theme.toLowerCase()} content and tools for all levels" },
          { title: "Latest Updates", description: "Stay informed with the newest ${theme.toLowerCase()} trends and insights" }
        ]`
  );
  
  // Fix values array if it's a string instead of array  
  processedContent = processedContent.replace(
    /values:\s*"[^"]+"/g,
    `values: [
          { title: "Excellence", description: "Committed to delivering the highest quality ${theme.toLowerCase()} content" },
          { title: "Innovation", description: "Pioneering new approaches to ${theme.toLowerCase()} education" },
          { title: "Community", description: "Building a supportive network of ${theme.toLowerCase()} enthusiasts" },
          { title: "Integrity", description: "Providing honest, accurate, and trustworthy information" }
        ]`
  );
  
  // Fix FAQ items if it's a string instead of array
  processedContent = processedContent.replace(
    /items:\s*"[^"]+"/g,
    `items: [
          { question: "How often is content updated?", answer: "We publish new ${theme.toLowerCase()} content weekly with regular updates" },
          { question: "Is the content free to access?", answer: "Yes, all our ${theme.toLowerCase()} resources are freely available to everyone" },
          { question: "Can I contribute content?", answer: "We welcome guest contributions from ${theme.toLowerCase()} experts and enthusiasts" },
          { question: "How do I stay updated?", answer: "Subscribe to our newsletter for the latest ${theme.toLowerCase()} insights and updates" },
          { question: "Who creates the content?", answer: "Our content is created by experienced ${theme.toLowerCase()} professionals and researchers" }
        ]`
  );
  
  // Fix keywords arrays that have been replaced with strings
  processedContent = processedContent.replace(
    /keywords:\s*"[^"]+"/g,
    'keywords: ["guide", "tutorial", "tips", "expert", "insights", "best", "how-to", "essential", "comprehensive"]'
  );
  
  // Fix seoKeywords that should be comma-separated strings
  processedContent = processedContent.replace(
    /seoKeywords:\s*\[[^\]]+\]/g,
    match => {
      // If it's already an array, convert to comma-separated string
      const arrayContent = match.match(/\[([^\]]+)\]/);
      if (arrayContent) {
        const items = arrayContent[1].replace(/["']/g, '').split(',').map(s => s.trim());
        return `seoKeywords: "${items.join(', ')}"`;
      }
      return match;
    }
  );
  
  // Ensure seoKeywords are strings not arrays where they appear as generic text
  processedContent = processedContent.replace(
    /seoKeywords:\s*"Entertainment & Pop Culture[^"]*"/gi,
    `seoKeywords: "${theme.toLowerCase()}, ${siteName.toLowerCase()}, guides, tutorials, tips, resources"`
  );
  
  // Fix any remaining instances of theme placeholder text appearing in wrong places
  const themePattern = new RegExp(`"${theme}\\s+insights\\s+and\\s+resources"`, 'gi');
  processedContent = processedContent.replace(themePattern, (match, offset) => {
    // Check context to determine what should be there
    const before = processedContent.substring(Math.max(0, offset - 50), offset);
    
    if (before.includes('popularTopics:')) {
      return '["trending", "featured", "latest", "popular", "must-read"]';
    } else if (before.includes('keywords:')) {
      return '["guide", "tutorial", "tips", "expert", "insights", "best", "how-to", "essential", "comprehensive"]';
    } else if (before.includes('aboutContent:') || before.includes('description:')) {
      return `"Explore comprehensive ${theme.toLowerCase()} content, guides, and expert insights at ${siteName}."`;
    }
    
    return match; // Keep original if context unclear
  });
  
  // Fix unquoted strings that contain theme text
  const unquotedPattern = new RegExp(`(services:|description:|content:)\\s*(Professional\\s+)?${theme.toLowerCase()}[^,\n}]*`, 'gi');
  processedContent = processedContent.replace(unquotedPattern, (match, prefix, professional) => {
    const content = match.substring(prefix.length).trim();
    // If the content is not already quoted, quote it
    if (!content.startsWith('"') && !content.startsWith("'") && !content.startsWith('[')) {
      return `${prefix} "${content}"`;
    }
    return match;
  });
  
  // Specifically fix the unquoted "Professional entertainment & pop culture content and resources"
  processedContent = processedContent.replace(
    /services:\s*Professional\s+entertainment\s*&\s*pop\s+culture\s+content\s+and\s+resources/gi,
    'services: "Professional entertainment & pop culture content and resources"'
  );
  
  // Fix any other unquoted string values after colons that contain special characters
  processedContent = processedContent.replace(
    /^(\s*\w+:\s*)([^"\[\{].*[&\s].*)$/gm,
    (match, prefix, value) => {
      // Skip if it's already properly formatted
      if (value.trim().match(/^["'\[\{]/) || value.trim().match(/^(true|false|null|\d+)$/)) {
        return match;
      }
      // Skip if it's a closing bracket or brace
      if (value.trim().match(/^[\}\]]/) || value.includes('{') || value.includes('}')) {
        return match;
      }
      // Quote the value if it contains text
      return `${prefix}"${value.trim()}"`;
    }
  );
  
  return processedContent;
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
 * Fix article count to exactly 25
 */
function fixArticleCount(configContent) {
  // Find the ARTICLE_GENERATION_CONFIG section
  const configMatch = configContent.match(/export const ARTICLE_GENERATION_CONFIG\s*=\s*\{([\s\S]*?)\n\}/m);
  
  if (!configMatch) {
    log('  ⚠️  Could not find ARTICLE_GENERATION_CONFIG in generated content', 'yellow');
    return configContent;
  }
  
  const configBody = configMatch[1];
  
  // Find the articles array within the config
  const articlesMatch = configBody.match(/articles:\s*\[([\s\S]*?)\](?=\s*,\s*apiSettings|\s*\})/);
  
  if (!articlesMatch) {
    log('  ⚠️  Could not find articles array in ARTICLE_GENERATION_CONFIG', 'yellow');
    return configContent;
  }
  
  const articlesContent = articlesMatch[1];
  
  // Extract individual article objects
  const articleMatches = articlesContent.match(/\{\s*topic:\s*"[^"]+",\s*keywords:\s*\[[^\]]+\],\s*category:\s*"[^"]+"\s*\}/g);
  
  if (!articleMatches) {
    log('  ⚠️  Could not parse articles', 'yellow');
    return configContent;
  }
  
  const articleCount = articleMatches.length;
  log(`  📊 Found ${articleCount} articles (need exactly 25)`, articleCount === 25 ? 'green' : 'yellow');
  
  if (articleCount === 25) {
    return configContent;
  }
  
  let finalArticles;
  
  if (articleCount > 25) {
    // Take only first 25 articles
    finalArticles = articleMatches.slice(0, 25);
    log(`  ✂️  Trimmed from ${articleCount} to 25 articles`, 'green');
  } else {
    // Duplicate last article to reach 25
    finalArticles = [...articleMatches];
    const lastArticle = articleMatches[articleMatches.length - 1];
    
    while (finalArticles.length < 25) {
      finalArticles.push(lastArticle);
    }
    log(`  📝 Duplicated last article to reach 25 (was ${articleCount})`, 'green');
  }
  
  // Build the new articles array content
  const newArticlesContent = finalArticles.join(',\n    ');
  
  // Replace only the articles array content
  const newConfigBody = configBody.replace(
    /articles:\s*\[([\s\S]*?)\](?=\s*,\s*apiSettings|\s*\})/,
    `articles: [\n    ${newArticlesContent}\n  ]`
  );
  
  // Replace the entire ARTICLE_GENERATION_CONFIG in the original content
  const newContent = configContent.replace(
    /export const ARTICLE_GENERATION_CONFIG\s*=\s*\{[\s\S]*?\n\}/m,
    `export const ARTICLE_GENERATION_CONFIG = {${newConfigBody}\n}`
  );
  
  return newContent;
}


/**
 * Fix common syntax issues in generated JavaScript
 */
function fixCommonSyntaxIssues(content) {
  let fixed = content;
  
  // Fix quoted boolean values
  fixed = fixed.replace(/:\s*"true"/g, ': true');
  fixed = fixed.replace(/:\s*"false"/g, ': false');
  fixed = fixed.replace(/:\s*'true'/g, ': true');
  fixed = fixed.replace(/:\s*'false'/g, ': false');
  
  // Fix broken boolean/string patterns like: lazyLoading: "true,
  fixed = fixed.replace(/lazyLoading:\s*"true,/g, 'lazyLoading: true,');
  fixed = fixed.replace(/enabled:\s*"true,/g, 'enabled: true,');
  
  // Fix the specific pattern: placeholder: "blur","
  fixed = fixed.replace(/placeholder:\s*"blur","/g, 'placeholder: "blur",');
  
  // Fix broken string patterns where quotes are split
  fixed = fixed.replace(/(\w+):\s*"([^"]+),"$/gm, '$1: "$2",');
  
  // Fix quoted numeric values (common patterns)
  fixed = fixed.replace(/temperature:\s*"([0-9.]+)"/g, 'temperature: $1');
  fixed = fixed.replace(/maxTokens:\s*"([0-9]+)"/g, 'maxTokens: $1');
  fixed = fixed.replace(/postsPerPage:\s*"([0-9]+)"/g, 'postsPerPage: $1');
  fixed = fixed.replace(/quality:\s*"([0-9]+)"/g, 'quality: $1');
  fixed = fixed.replace(/concurrentRequests:\s*"([0-9]+)"/g, 'concurrentRequests: $1');
  fixed = fixed.replace(/retryAttempts:\s*"([0-9]+)"/g, 'retryAttempts: $1');
  
  // Fix broken numeric patterns like: temperature: "0.7,
  fixed = fixed.replace(/temperature:\s*"([0-9.]+),/g, 'temperature: $1,');
  // Fix pattern: maxTokens: 8000,"
  fixed = fixed.replace(/maxTokens:\s*([0-9]+),"/g, 'maxTokens: $1,');
  // Fix pattern: concurrentRequests: "5,
  fixed = fixed.replace(/concurrentRequests:\s*"([0-9]+),$/gm, 'concurrentRequests: $1,');
  // Fix pattern: retryAttempts: 3"
  fixed = fixed.replace(/retryAttempts:\s*([0-9]+)"$/gm, 'retryAttempts: $1');
  
  // Generic fix for numeric values with broken quotes
  fixed = fixed.replace(/(\w+):\s*"([0-9.]+),$/gm, '$1: $2,');
  fixed = fixed.replace(/(\w+):\s*([0-9.]+)"$/gm, '$1: $2');
  
  // Generic pattern for any property that should be a number
  fixed = fixed.replace(/^(\s*)(temperature|maxTokens|postsPerPage|quality|concurrentRequests|retryAttempts):\s*"([0-9.]+)"/gm, '$1$2: $3');
  
  // Fix enabled, disabled, sticky, show* properties (booleans)
  fixed = fixed.replace(/^(\s*)(enabled|disabled|sticky|showSearch|showThemeToggle|showNewsletter|showSocialLinks|showCategories|showHero|showFeaturedPosts|showLatestPosts|lazyLoading|enforceAlt|index|follow):\s*"(true|false)"/gm, '$1$2: $3');
  
  // Fix services, values, items if they're strings instead of arrays
  // Look for pattern: services: "some string content"
  const serviceStringPattern = /services:\s*"[^"]+"/;
  if (serviceStringPattern.test(fixed)) {
    fixed = fixed.replace(serviceStringPattern, `services: [
          { title: "Expert Guides", description: "Comprehensive tutorials from professionals" },
          { title: "Resources", description: "Curated content and tools for all levels" },
          { title: "Updates", description: "Latest trends and insights in the field" }
        ]`);
  }
  
  // Fix unquoted string values (like: values: Professional entertainment...)
  // This specific pattern appears in the values field
  fixed = fixed.replace(/values:\s*([A-Z][^.\n{\[]*\.)(?=\s*[,}\n])/gm, 
    `values: [
          { title: "Excellence", description: "Committed to highest quality content" },
          { title: "Innovation", description: "Pioneering new approaches" },
          { title: "Community", description: "Building strong networks" },
          { title: "Integrity", description: "Providing reliable information" }
        ]`);
  
  // Fix other unquoted string values
  fixed = fixed.replace(/(\w+):\s*([A-Z][^:,\n{\["'][^.\n]*\.)(?=\s*[\n}])/gm, (match, prop, value) => {
    // Skip if it's values (already handled above)
    if (prop === 'values') return match;
    // Quote the unquoted string value
    return `${prop}: "${value.trim()}"`;
  });
  
  const valuesStringPattern = /values:\s*"[^"]+"/;
  if (valuesStringPattern.test(fixed)) {
    fixed = fixed.replace(valuesStringPattern, `values: [
          { title: "Excellence", description: "Committed to highest quality content" },
          { title: "Innovation", description: "Pioneering new educational approaches" },
          { title: "Community", description: "Building supportive networks" },
          { title: "Integrity", description: "Providing accurate information" }
        ]`);
  }
  
  // Fix lines ending with just a quote
  fixed = fixed.replace(/^(\s*)"$/gm, '');
  
  // Clean up any remaining double commas
  fixed = fixed.replace(/,,/g, ',');
  
  const faqItemsStringPattern = /items:\s*"[^"]+"/;
  if (faqItemsStringPattern.test(fixed)) {
    fixed = fixed.replace(faqItemsStringPattern, `items: [
          { question: "How often is content updated?", answer: "We publish new content weekly" },
          { question: "Is content free?", answer: "Yes, all resources are freely available" },
          { question: "Can I contribute?", answer: "We welcome guest contributions" },
          { question: "How to stay updated?", answer: "Subscribe to our newsletter" },
          { question: "Who creates content?", answer: "Experienced professionals create our content" }
        ]`);
  }
  
  return fixed;
}

/**
 * Generate complete config using GPT
 */
async function generateCompleteConfig(openai, siteInfo) {
  log(`🤖 Generating complete config for "${siteInfo.theme}" theme...`, 'cyan');
  
  try {
    const prompt = generateConfigPrompt(siteInfo);
    
    const response = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [{
        role: "system",
        content: `You are a STRICT JavaScript syntax validator and code generator.

⚠️ CRITICAL: Your output MUST be syntactically perfect JavaScript or it will crash the application.

🔴 MANDATORY SYNTAX RULES - VIOLATION MEANS FAILURE:

1. BOOLEANS are JavaScript keywords - NEVER quote them:
   ✅ enabled: true,
   ❌ enabled: "true",
   
2. NUMBERS are numeric literals - NEVER quote them:
   ✅ temperature: 0.7,
   ❌ temperature: "0.7",
   
3. ARRAYS use square brackets - NEVER use strings:
   ✅ services: [{title: "A", description: "B"}],
   ❌ services: "some text",

4. EVERY property needs a comma except the last one

5. These properties are ALWAYS booleans (no quotes):
   enabled, disabled, follow, index, sticky, showSearch, showThemeToggle,
   showNewsletter, showSocialLinks, showCategories, showHero,
   showFeaturedPosts, showLatestPosts, lazyLoading, enforceAlt

6. These properties are ALWAYS numbers (no quotes):
   temperature, maxTokens, postsPerPage, quality,
   concurrentRequests, retryAttempts

7. These properties are ALWAYS arrays of objects:
   services (3 objects), values (4 objects), items (5 objects)

BEFORE WRITING ANY PROPERTY:
- PAUSE and identify the data type
- APPLY the correct syntax rule
- DOUBLE-CHECK for quotes on booleans/numbers
- VERIFY arrays are not strings

Generate ONLY valid JavaScript code. No markdown, no explanations, no comments outside the code.
The code MUST execute without syntax errors.`
      }, {
        role: "user",
        content: prompt
      }],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens
    });

    let content = response.choices[0].message.content;
    
    // Clean up the response
    content = content.replace(/```javascript\n?/g, '');
    content = content.replace(/```js\n?/g, '');
    content = content.replace(/```\n?/g, '');
    content = content.replace(/^```\n/gm, '');
    content = content.replace(/\n```$/gm, '');
    
    // Fix common syntax issues FIRST
    content = fixCommonSyntaxIssues(content);
    
    // Post-process to remove common placeholder patterns
    content = postProcessPlaceholders(content, siteInfo);
    
    // Fix article count if needed (for trimming if over 25)
    content = fixArticleCount(content);
    
    return content;
  } catch (error) {
    log(`❌ Error generating config: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Validate the generated config against exact requirements
 */
function validateConfig(configContent) {
  const requiredSections = [
    'CURRENT_WEBSITE_CONTENT',
    'ARTICLE_GENERATION_CONFIG',
    'CATEGORY_INFO',
    'CURRENT_NAVIGATION_LINKS',
    'NAV_BAR_LINKS',
    'FOOTER_NAVIGATION_LINKS',
    'FOOTER_LEGAL_LINKS',
    'CURRENT_OTHER_LINKS',
    'CURRENT_SOCIAL_LINKS'
  ];
  
  const issues = [];
  
  // Check required sections
  requiredSections.forEach(section => {
    if (!configContent.includes(`export const ${section}`)) {
      issues.push(`❌ Missing required export: ${section}`);
    }
  });
  
  // Check for article count (must be exactly 25)
  const articleMatches = configContent.match(/topic:\s*"[^"]+"/g);
  if (!articleMatches || articleMatches.length !== 25) {
    issues.push(`❌ Found ${articleMatches ? articleMatches.length : 0} articles (need exactly 25)`);
  }
  
  // Check for placeholder text patterns
  const placeholderPatterns = [
    /\[[\d\-\s]*char[s]?\s+[^\]]*\]/gi,  // [150-160 chars description]
    /\/\/ \d+-\d+ chars/gi,              // // 150-160 chars
    /\[[^\]]*\bchar[s]?\b[^\]]*\]/gi     // Any [text with char/chars]
  ];
  
  placeholderPatterns.forEach(pattern => {
    const matches = configContent.match(pattern);
    if (matches) {
      issues.push(`❌ Contains placeholder text: ${matches[0]} (${matches.length} instances)`);
    }
  });
  
  // Check for undefined/empty values
  if (configContent.includes('undefined') || configContent.includes('null')) {
    issues.push('❌ Contains undefined or null values');
  }
  
  // Extract and validate categories
  const categoryInfoMatch = configContent.match(/export const CATEGORY_INFO\s*=\s*\{([\s\S]*?)\n\};/);
  let definedCategories = [];
  
  if (categoryInfoMatch) {
    const categoryContent = categoryInfoMatch[1];
    // Find all category keys (quoted strings followed by colon)
    const categoryKeys = categoryContent.match(/"[^"]+"\s*:/g);
    
    if (!categoryKeys || categoryKeys.length !== 8) {
      issues.push(`❌ CATEGORY_INFO has ${categoryKeys ? categoryKeys.length : 0} categories (need exactly 8)`);
    } else {
      definedCategories = categoryKeys.map(key => key.replace(/[":\s]/g, ''));
      log(`✅ Found 8 categories: ${definedCategories.join(', ')}`, 'green');
    }
  } else {
    issues.push('❌ CATEGORY_INFO section not found or malformed');
  }
  
  // Check categories array in CURRENT_WEBSITE_CONTENT
  const categoriesArrayMatch = configContent.match(/categories:\s*\[([\s\S]*?)\]/);
  if (categoriesArrayMatch && definedCategories.length === 8) {
    const arrayContent = categoriesArrayMatch[1];
    const categoriesInArray = arrayContent.match(/"[^"]+"/g);
    
    if (categoriesInArray) {
      const arrayCategories = categoriesInArray.map(cat => cat.replace(/"/g, ''));
      
      if (arrayCategories.length !== 8) {
        issues.push(`❌ CURRENT_WEBSITE_CONTENT.categories has ${arrayCategories.length} items (need exactly 8)`);
      }
      
      // Check consistency between categories array and CATEGORY_INFO
      const missingFromArray = definedCategories.filter(cat => !arrayCategories.includes(cat));
      const extraInArray = arrayCategories.filter(cat => !definedCategories.includes(cat));
      
      if (missingFromArray.length > 0) {
        issues.push(`❌ Categories missing from categories array: ${missingFromArray.join(', ')}`);
      }
      if (extraInArray.length > 0) {
        issues.push(`❌ Categories in array but not in CATEGORY_INFO: ${extraInArray.join(', ')}`);
      }
    }
  } else if (definedCategories.length === 8) {
    issues.push('❌ Could not find or parse categories array in CURRENT_WEBSITE_CONTENT');
  }
  
  // Validate article categories
  if (articleMatches && definedCategories.length === 8) {
    const articleCategoryMatches = configContent.match(/category:\s*"([^"]+)"/g);
    
    if (articleCategoryMatches) {
      const usedCategories = {};
      const invalidCategories = [];
      
      articleCategoryMatches.forEach(match => {
        const category = match.match(/category:\s*"([^"]+)"/)[1];
        if (!definedCategories.includes(category)) {
          invalidCategories.push(category);
        } else {
          usedCategories[category] = (usedCategories[category] || 0) + 1;
        }
      });
      
      // Report invalid categories
      if (invalidCategories.length > 0) {
        issues.push(`❌ Articles use undefined categories: ${[...new Set(invalidCategories)].join(', ')}`);
      }
      
      // Check distribution (should be 3-4 articles per category, allowing 2-5 range)
      let totalArticlesAssigned = 0;
      definedCategories.forEach(cat => {
        const count = usedCategories[cat] || 0;
        totalArticlesAssigned += count;
        if (count < 2) {
          issues.push(`⚠️ Category "${cat}" has only ${count} articles (recommend 3-4)`);
        } else if (count > 5) {
          issues.push(`⚠️ Category "${cat}" has ${count} articles (recommend 3-4, max 5)`);
        }
      });
      
      // Check if we're missing any categories
      const unusedCategories = definedCategories.filter(cat => !usedCategories[cat]);
      if (unusedCategories.length > 0) {
        issues.push(`❌ Categories with no articles assigned: ${unusedCategories.join(', ')}`);
      }
    }
  }
  
  // Check for proper article keyword structure
  if (articleMatches) {
    const keywordArrayMatches = configContent.match(/keywords:\s*\[[^\]]+\]/g);
    if (keywordArrayMatches) {
      // Only check the first 25 (article keywords, not category keywords)
      const articleKeywords = keywordArrayMatches.slice(0, Math.min(25, keywordArrayMatches.length));
      
      articleKeywords.forEach((arr, index) => {
        const keywords = arr.match(/"[^"]+"/g);
        if (!keywords || keywords.length !== 4) {
          issues.push(`❌ Article ${index + 1} has ${keywords ? keywords.length : 0} keywords (need exactly 4)`);
        }
      });
    }
  }
  
  // Check for basic JavaScript syntax
  try {
    // Create a simplified version for syntax checking
    const testContent = configContent
      .replace(/export\s+const/g, 'const')
      .replace(/export\s+{[^}]+}/g, '');
    new Function(testContent);
  } catch (error) {
    issues.push(`❌ JavaScript syntax error: ${error.message}`);
  }
  
  // Check for required structural elements
  const structuralChecks = [
    { pattern: /branding:\s*\{/, name: 'branding object' },
    { pattern: /colorTheme:\s*\{/, name: 'colorTheme object' },
    { pattern: /seo:\s*\{/, name: 'seo object' },
    { pattern: /pages:\s*\{/, name: 'pages object' },
    { pattern: /siteReferences:\s*\{/, name: 'siteReferences object' }
  ];
  
  structuralChecks.forEach(check => {
    if (!check.pattern.test(configContent)) {
      issues.push(`❌ Missing required ${check.name} in CURRENT_WEBSITE_CONTENT`);
    }
  });
  
  return issues;
}

/**
 * Save the generated config
 */
function saveConfig(configContent, siteInfo) {
  try {
    // Create backup of existing config if it exists
    if (fs.existsSync(CONFIG.outputPath)) {
      fs.copyFileSync(CONFIG.outputPath, CONFIG.backupPath);
      log(`📋 Created backup: ${path.basename(CONFIG.backupPath)}`, 'cyan');
    }
    
    // Save new config
    fs.writeFileSync(CONFIG.outputPath, configContent);
    log(`✅ Saved new config.template.js for "${siteInfo.theme}"`, 'green');
    
    // Also save a themed copy for reference
    const themedPath = path.join(__dirname, `../config.template-${siteInfo.siteName.toLowerCase()}.js`);
    fs.writeFileSync(themedPath, configContent);
    log(`📄 Also saved as: ${path.basename(themedPath)}`, 'cyan');
    
  } catch (error) {
    log(`❌ Error saving config: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Display optimized summary of generated config
 */
function displaySummary(configContent, siteInfo) {
  log('\n📊 Configuration Generation Summary:', 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log(`  🎯 Theme: ${siteInfo.theme}`, 'blue');
  log(`  🌐 Domain: ${siteInfo.domain}`, 'blue');
  log(`  📛 Site Name: ${siteInfo.siteName}`, 'blue');
  
  // Check required exports
  const requiredExports = [
    'CURRENT_WEBSITE_CONTENT',
    'ARTICLE_GENERATION_CONFIG', 
    'CATEGORY_INFO',
    'CURRENT_NAVIGATION_LINKS',
    'NAV_BAR_LINKS',
    'FOOTER_NAVIGATION_LINKS',
    'FOOTER_LEGAL_LINKS',
    'CURRENT_OTHER_LINKS',
    'CURRENT_SOCIAL_LINKS'
  ];
  
  log(`\n📦 Export Validation:`, 'yellow');
  let missingExports = 0;
  requiredExports.forEach(exportName => {
    const exists = configContent.includes(`export const ${exportName}`);
    log(`  ${exists ? '✅' : '❌'} ${exportName}`, exists ? 'green' : 'red');
    if (!exists) missingExports++;
  });
  
  // Count articles
  const articleMatches = configContent.match(/topic:\s*"([^"]+)"/g);
  const articleCount = articleMatches ? articleMatches.length : 0;
  log(`\n📝 Articles: ${articleCount}/25 ${articleCount === 25 ? '✅' : '❌'}`, articleCount === 25 ? 'green' : 'red');
  
  if (articleMatches && articleMatches.length > 0) {
    // Show sample articles
    const sampleTopics = articleMatches.slice(0, 3).map(m => m.replace(/topic:\s*"([^"]+)"/, '$1'));
    log(`  Sample Topics:`, 'cyan');
    sampleTopics.forEach((topic, i) => {
      log(`    ${i + 1}. ${topic}`, 'blue');
    });
    if (articleMatches.length > 3) {
      log(`    ... and ${articleMatches.length - 3} more`, 'blue');
    }
  }
  
  // Count categories
  const categoryInfoMatch = configContent.match(/export const CATEGORY_INFO\s*=\s*\{([\s\S]*?)\n\};/);
  let categoryCount = 0;
  let categoryNames = [];
  
  if (categoryInfoMatch) {
    const categoryKeys = categoryInfoMatch[1].match(/"[^"]+"\s*:/g);
    categoryCount = categoryKeys ? categoryKeys.length : 0;
    if (categoryKeys) {
      categoryNames = categoryKeys.map(key => key.replace(/[":\s]/g, ''));
    }
  }
  
  log(`\n📂 Categories: ${categoryCount}/8 ${categoryCount === 8 ? '✅' : '❌'}`, categoryCount === 8 ? 'green' : 'red');
  
  if (categoryNames.length > 0) {
    log(`  Categories: ${categoryNames.join(', ')}`, 'blue');
  }
  
  // Check category consistency
  const categoriesArrayMatch = configContent.match(/categories:\s*\[([\s\S]*?)\]/);
  if (categoriesArrayMatch && categoryCount === 8) {
    const categoriesInArray = categoriesArrayMatch[1].match(/"[^"]+"/g);
    const arrayCount = categoriesInArray ? categoriesInArray.length : 0;
    log(`  Categories Array: ${arrayCount}/8 ${arrayCount === 8 ? '✅' : '❌'}`, arrayCount === 8 ? 'green' : 'red');
  }
  
  // Check for placeholder text
  const placeholderPatterns = [
    /\[[\d\-\s]*char[s]?\s+[^\]]*\]/gi,
    /\[[^\]]*\bchar[s]?\b[^\]]*\]/gi
  ];
  
  let placeholderCount = 0;
  placeholderPatterns.forEach(pattern => {
    const matches = configContent.match(pattern);
    if (matches) placeholderCount += matches.length;
  });
  
  log(`\n🔍 Quality Check:`, 'yellow');
  log(`  Missing Exports: ${missingExports} ${missingExports === 0 ? '✅' : '❌'}`, missingExports === 0 ? 'green' : 'red');
  log(`  Placeholder Text: ${placeholderCount} instances ${placeholderCount === 0 ? '✅' : '⚠️'}`, placeholderCount === 0 ? 'green' : 'yellow');
  
  // Overall status
  const isComplete = missingExports === 0 && articleCount === 25 && categoryCount === 8;
  log(`\n🎯 Overall Status: ${isComplete ? '✅ COMPLETE' : '⚠️ NEEDS REVIEW'}`, isComplete ? 'green' : 'yellow');
  
  if (!isComplete) {
    log(`\n💡 Issues to review:`, 'yellow');
    if (missingExports > 0) log(`  • ${missingExports} missing exports`, 'yellow');
    if (articleCount !== 25) log(`  • Article count: ${articleCount} (need 25)`, 'yellow');
    if (categoryCount !== 8) log(`  • Category count: ${categoryCount} (need 8)`, 'yellow');
    if (placeholderCount > 0) log(`  • ${placeholderCount} placeholder texts remain`, 'yellow');
  }
}

/**
 * Main function
 */
async function main() {
  log('\n====================================', 'bright');
  log('    Complete Config Generator', 'bright');
  log('====================================', 'bright');
  
  try {
    // Read site configuration from config.txt
    log('\n📖 Reading config.txt...', 'cyan');
    const siteInfo = readConfigFile();
    
    log('\n🌐 Site Configuration:', 'yellow');
    log(`  Theme: ${siteInfo.theme}`, 'blue');
    log(`  Domain: ${siteInfo.domain}`, 'blue');
    log(`  Site Name: ${siteInfo.siteName}`, 'blue');
    
    // Initialize OpenAI
    const openai = initOpenAI();
    log('\n✅ OpenAI client initialized', 'green');
    
    // Generate complete configuration
    log('\n🚀 Generating complete configuration...', 'cyan');
    log('  This may take 30-60 seconds...', 'yellow');
    
    const startTime = Date.now();
    const configContent = await generateCompleteConfig(openai, siteInfo);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(`✅ Configuration generated in ${elapsed}s`, 'green');
    
    // Validate the generated config
    log('\n🔍 Validating generated configuration...', 'cyan');
    const issues = validateConfig(configContent);
    
    if (issues.length > 0) {
      log('⚠️  Validation warnings:', 'yellow');
      issues.forEach(issue => log(`  - ${issue}`, 'yellow'));
    } else {
      log('✅ All validation checks passed', 'green');
    }
    
    // Save the configuration
    saveConfig(configContent, siteInfo);
    
    // Display summary
    displaySummary(configContent, siteInfo);
    
    log('\n✨ Configuration Generation Complete!', 'bright');
    log('\n📝 Next Steps:', 'cyan');
    log('  1. Review the generated config.template.js', 'blue');
    log('  2. Run: npm run generate-articles', 'blue');
    log('  3. Run: npm run add-articles-improved', 'blue');
    log('  4. Run: npm run dev (to preview)', 'blue');
    
    log('\n💡 Tips:', 'yellow');
    log(`  - Backup saved as: ${path.basename(CONFIG.backupPath)}`, 'cyan');
    log('  - To change theme: edit config.txt and run this script again', 'cyan');
    log('  - Generated config includes 25 theme-relevant articles', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    
    if (error.message.includes('config.txt')) {
      log('\n📝 Create config.txt with 3 lines:', 'yellow');
      log('  Line 1: Your website theme (e.g., "AI Tools and Automation")', 'yellow');
      log('  Line 2: Your domain (e.g., "aitoolshub.com")', 'yellow');
      log('  Line 3: Your site name (e.g., "AIToolsHub")', 'yellow');
    } else if (error.message.includes('OPENAI_API_KEY')) {
      log('\n🔑 Setup Instructions:', 'yellow');
      log('  1. Make sure OPENAI_API_KEY is set in .env file', 'yellow');
      log('  2. Get your API key from: https://platform.openai.com/api-keys', 'yellow');
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