#!/usr/bin/env node

/**
 * Generate complete config.template.js using template-based approach
 * This approach guarantees no syntax errors by using a pre-structured template
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
  maxTokens: 16000,
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
 * Create the JavaScript template with placeholders
 */
function createTemplate(siteInfo) {
  const { theme, domain, siteName } = siteInfo;
  const sanitizedSiteName = siteName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  return `// ================================================================================
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

  categories: [{{CATEGORIES_ARRAY}}],

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
}

/**
 * Generate prompt for GPT to fill in placeholders
 */
function generatePrompt(siteInfo) {
  const { theme, domain, siteName } = siteInfo;
  
  return `You are a content generator for a JavaScript configuration file. Your task is to ONLY replace placeholders with appropriate content.

CRITICAL RULES:
1. ONLY replace text between {{}} markers
2. DO NOT modify any JavaScript syntax
3. DO NOT add quotes around your replacements
4. DO NOT change anything outside of {{}} markers
5. Generate real, meaningful content - not placeholder text

CONTEXT:
Theme: ${theme}
Domain: ${domain}
Site Name: ${siteName}

PLACEHOLDERS TO FILL:

1. SITE_DESCRIPTION: A 150-character description for the ${theme} website
2. SITE_TAGLINE: A catchy 30-50 character tagline
3. SEO_TITLE: A compelling SEO title (50-60 chars)
4. SEO_DESCRIPTION: SEO meta description (150-160 chars)
5. THEME_FOCUS: What the site focuses on (100 chars)
6. TARGET_AUDIENCE: Who the site is for (100 chars)
7. CATEGORIES_ARRAY: Generate exactly 8 category names relevant to ${theme}, formatted as: "Category1", "Category2", "Category3", "Category4", "Category5", "Category6", "Category7", "Category8"
8. HERO_TITLE: Homepage hero title (50 chars)
9. HERO_SUBTITLE: Homepage hero subtitle (100 chars)
10. HERO_ALT: Alt text for hero image
11. CATEGORIES_DESCRIPTION: Description for categories page
12. CATEGORIES_SUBTITLE: Subtitle for categories page
13. HERO_DESCRIPTION: Hero section description
14. NEWSLETTER_DESCRIPTION: Newsletter description
15. MISSION_STATEMENT: Company mission for ${theme}
16. SERVICE1_TITLE, SERVICE1_DESC: First service title and description
17. SERVICE2_TITLE, SERVICE2_DESC: Second service title and description  
18. SERVICE3_TITLE, SERVICE3_DESC: Third service title and description
19. VALUE1_TITLE, VALUE1_DESC: First value title and description
20. VALUE2_TITLE, VALUE2_DESC: Second value title and description
21. VALUE3_TITLE, VALUE3_DESC: Third value title and description
22. VALUE4_TITLE, VALUE4_DESC: Fourth value title and description
23. OVERVIEW_TITLE: Overview page title
24. OVERVIEW_DESCRIPTION: Overview page description
25. FOOTER_TAGLINE: Footer tagline
26. FOOTER_DESCRIPTION: Footer description
27. FOOTER_FOCUS: Footer focus statement
28. SUPPORT_DESCRIPTION: Support page description
29. SUPPORT_SUBTITLE: Support page subtitle
30. FAQ1_Q, FAQ1_A through FAQ5_Q, FAQ5_A: 5 FAQ questions and answers
31. HOME_DESCRIPTION: Homepage description
32. PRIVACY_STATEMENT: Privacy statement
33. PRIVACY_SERVICE_DESC: Privacy service description
34. NEWSLETTER_MAIN_DESC: Main newsletter description

35. ARTICLES_ARRAY: Generate exactly 25 article objects for ${theme}, each with:
   - topic: Article title
   - keywords: Array of exactly 4 keywords
   - category: Must use one of the 8 categories you defined above
   Format each as:
   { topic: "Article Title", keywords: ["keyword1", "keyword2", "keyword3", "keyword4"], category: "CategoryName" }

36. CATEGORY_INFO_CONTENT: Generate info for each of the 8 categories with this exact format:
  "CategoryName": {
    name: "CategoryName",
    description: "Category description",
    shortDescription: "Short description",
    icon: "📁",
    color: "#3B82F6",
    aboutContent: "About this category",
    detailedDescription: "Detailed category description",
    popularTopics: ["topic1", "topic2", "topic3"],
    seoKeywords: "keyword1, keyword2, keyword3",
    keywords: ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8", "kw9"]
  }

IMPORTANT: Generate ONLY the replacement values. The template structure is already perfect.`;
}

/**
 * Fill template with GPT-generated content
 */
async function fillTemplate(openai, template, siteInfo) {
  log(`🤖 Generating content for placeholders...`, 'cyan');
  
  try {
    const prompt = generatePrompt(siteInfo);
    
    const response = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [{
        role: "system",
        content: "You are a content generator. Replace placeholders with appropriate content. Never modify JavaScript syntax."
      }, {
        role: "user",
        content: prompt
      }],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens
    });

    const replacements = response.choices[0].message.content;
    
    // Parse the replacements and apply them to the template
    let filledTemplate = template;
    
    // Extract and replace each placeholder
    const lines = replacements.split('\n');
    let currentPlaceholder = '';
    let currentContent = '';
    
    for (const line of lines) {
      if (line.includes(':') && line.match(/^\d+\./)) {
        // Process previous placeholder if exists
        if (currentPlaceholder && currentContent) {
          filledTemplate = filledTemplate.replace(
            new RegExp(`{{${currentPlaceholder}}}`, 'g'),
            currentContent.trim()
          );
        }
        
        // Start new placeholder
        const match = line.match(/^\d+\.\s*([A-Z0-9_]+):\s*(.*)$/);
        if (match) {
          currentPlaceholder = match[1];
          currentContent = match[2];
        }
      } else if (currentPlaceholder) {
        // Continue collecting content for current placeholder
        currentContent += '\n' + line;
      }
    }
    
    // Process last placeholder
    if (currentPlaceholder && currentContent) {
      filledTemplate = filledTemplate.replace(
        new RegExp(`{{${currentPlaceholder}}}`, 'g'),
        currentContent.trim()
      );
    }
    
    return filledTemplate;
  } catch (error) {
    log(`❌ Error generating content: ${error.message}`, 'red');
    throw error;
  }
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
 * Main function
 */
async function main() {
  log(`\n${colors.bright}====================================${colors.reset}`);
  log(`${colors.bright}    Template Config Generator${colors.reset}`);
  log(`${colors.bright}====================================${colors.reset}`);
  
  try {
    // Read config
    log(`\n📖 Reading config.txt...`, 'cyan');
    const siteInfo = readConfigFile();
    
    log(`\n🌐 Site Configuration:`, 'yellow');
    log(`  Theme: ${siteInfo.theme}`, 'blue');
    log(`  Domain: ${siteInfo.domain}`, 'blue');
    log(`  Site Name: ${siteInfo.siteName}`, 'blue');
    
    // Initialize OpenAI
    const openai = initOpenAI();
    log(`\n✅ OpenAI client initialized`, 'green');
    
    // Create template
    log(`\n🚀 Creating template structure...`, 'cyan');
    const template = createTemplate(siteInfo);
    
    // Fill template with GPT
    log(`\n🤖 Filling template with content...`, 'cyan');
    const startTime = Date.now();
    const filledConfig = await fillTemplate(openai, template, siteInfo);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ Configuration generated in ${duration}s`, 'green');
    
    // Backup existing config if it exists
    if (fs.existsSync(CONFIG.outputPath)) {
      fs.copyFileSync(CONFIG.outputPath, CONFIG.backupPath);
      log(`📋 Created backup: ${path.basename(CONFIG.backupPath)}`, 'cyan');
    }
    
    // Save new config
    fs.writeFileSync(CONFIG.outputPath, filledConfig, 'utf-8');
    log(`✅ Saved new config.template.js for "${siteInfo.theme}"`, 'green');
    
    // Also save a themed version
    const themedPath = CONFIG.outputPath.replace('.js', `-${siteInfo.siteName.toLowerCase()}.js`);
    fs.writeFileSync(themedPath, filledConfig, 'utf-8');
    log(`📄 Also saved as: ${path.basename(themedPath)}`, 'cyan');
    
    log(`\n${colors.bright}✨ Configuration Generation Complete!${colors.reset}`);
    log(`\n📝 Next Steps:`, 'cyan');
    log(`  1. Review the generated config.template.js`, 'blue');
    log(`  2. Run: npm run generate-articles`, 'blue');
    log(`  3. Run: npm run add-articles-improved`, 'blue');
    log(`  4. Run: npm run dev (to preview)`, 'blue');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});