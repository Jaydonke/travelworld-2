#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configDir = path.join(__dirname, '../config');
const categoriesDir = path.join(__dirname, '../src/content/categories');

// OptiNook Digital Marketing theme configuration
const optiNookTheme = {
  "optinook-marketing-theme": {
    "name": "OptiNook Digital Marketing Theme",
    "description": "Digital marketing strategies, SEO insights, and growth-driven content solutions",
    "categories": {
      "seo-strategy": {
        "keywords": [
          "seo",
          "search",
          "optimization",
          "serp",
          "keyword",
          "ranking",
          "google",
          "algorithm",
          "semantic",
          "clustering",
          "backlink",
          "meta",
          "schema",
          "crawl",
          "index"
        ],
        "description": "SEO & Search Strategy"
      },
      "content-marketing": {
        "keywords": [
          "content",
          "writing",
          "blog",
          "article",
          "copywriting",
          "storytelling",
          "editorial",
          "calendar",
          "engagement",
          "viral",
          "shareable",
          "evergreen",
          "pillar"
        ],
        "description": "Content Marketing"
      },
      "social-media": {
        "keywords": [
          "social",
          "media",
          "facebook",
          "instagram",
          "twitter",
          "linkedin",
          "tiktok",
          "youtube",
          "influencer",
          "engagement",
          "community",
          "hashtag",
          "viral",
          "stories"
        ],
        "description": "Social Media Marketing"
      },
      "paid-advertising": {
        "keywords": [
          "ads",
          "advertising",
          "ppc",
          "google ads",
          "facebook ads",
          "campaign",
          "cpc",
          "cpm",
          "retargeting",
          "remarketing",
          "bidding",
          "ad copy",
          "landing page",
          "conversion"
        ],
        "description": "Paid Advertising & PPC"
      },
      "email-marketing": {
        "keywords": [
          "email",
          "newsletter",
          "automation",
          "drip",
          "campaign",
          "subscriber",
          "list",
          "segmentation",
          "open rate",
          "click rate",
          "deliverability",
          "nurture",
          "funnel"
        ],
        "description": "Email Marketing"
      },
      "analytics-data": {
        "keywords": [
          "analytics",
          "data",
          "metrics",
          "kpi",
          "tracking",
          "measurement",
          "google analytics",
          "heatmap",
          "dashboard",
          "reporting",
          "insights",
          "performance",
          "roi",
          "attribution"
        ],
        "description": "Analytics & Data"
      },
      "conversion-optimization": {
        "keywords": [
          "conversion",
          "optimization",
          "cro",
          "landing page",
          "a/b testing",
          "split test",
          "funnel",
          "checkout",
          "cart",
          "form",
          "ux",
          "user experience",
          "bounce rate"
        ],
        "description": "Conversion Optimization"
      },
      "marketing-automation": {
        "keywords": [
          "automation",
          "workflow",
          "tool",
          "software",
          "crm",
          "integration",
          "zapier",
          "api",
          "efficiency",
          "streamline",
          "process",
          "scale",
          "personalization"
        ],
        "description": "Marketing Automation"
      },
      "brand-strategy": {
        "keywords": [
          "brand",
          "branding",
          "identity",
          "positioning",
          "messaging",
          "voice",
          "tone",
          "logo",
          "design",
          "reputation",
          "awareness",
          "loyalty",
          "trust"
        ],
        "description": "Brand Strategy"
      },
      "growth-hacking": {
        "keywords": [
          "growth",
          "hacking",
          "viral",
          "scaling",
          "startup",
          "acquisition",
          "retention",
          "referral",
          "product-market fit",
          "mvp",
          "lean",
          "agile",
          "experiment"
        ],
        "description": "Growth Hacking"
      }
    },
    "defaultCategory": "content-marketing"
  }
};

// Categories to create with proper structure
const categoriesToCreate = {
  'seo-strategy': {
    title: 'SEO & Search Strategy',
    path: 'seo-strategy'
  },
  'content-marketing': {
    title: 'Content Marketing',
    path: 'content-marketing'
  },
  'social-media': {
    title: 'Social Media Marketing',
    path: 'social-media'
  },
  'paid-advertising': {
    title: 'Paid Advertising & PPC',
    path: 'paid-advertising'
  },
  'email-marketing': {
    title: 'Email Marketing',
    path: 'email-marketing'
  },
  'analytics-data': {
    title: 'Analytics & Data',
    path: 'analytics-data'
  },
  'conversion-optimization': {
    title: 'Conversion Optimization',
    path: 'conversion-optimization'
  },
  'marketing-automation': {
    title: 'Marketing Automation',
    path: 'marketing-automation'
  },
  'brand-strategy': {
    title: 'Brand Strategy',
    path: 'brand-strategy'
  },
  'growth-hacking': {
    title: 'Growth Hacking',
    path: 'growth-hacking'
  }
};

console.log('🎯 Creating OptiNook Digital Marketing Theme...\n');

// Step 1: Add theme to categorization rules
const rulesPath = path.join(configDir, 'categorization-rules.json');
const existingRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

// Add new theme
Object.assign(existingRules, optiNookTheme);

// Write updated rules
fs.writeFileSync(rulesPath, JSON.stringify(existingRules, null, 2));
console.log('✅ Added OptiNook theme to categorization rules');

// Step 2: Create category directories and index.json files
for (const [categoryId, data] of Object.entries(categoriesToCreate)) {
  const categoryPath = path.join(categoriesDir, categoryId);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
  
  // Create or update index.json with proper format
  const indexPath = path.join(categoryPath, 'index.json');
  const indexContent = {
    title: data.title,
    path: data.path  // Required field!
  };
  
  fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
  console.log(`✅ Created category: ${categoryId}`);
}

// Step 3: Update theme config to use new theme
const themeConfigPath = path.join(configDir, 'theme-config.json');
const themeConfig = {
  "currentTheme": "optinook-marketing-theme",
  "fallbackTheme": "content-marketing",
  "themeSettings": {
    "enableSmartCategorization": true,
    "enableManualOverride": true,
    "logCategoryDecisions": true
  }
};

fs.writeFileSync(themeConfigPath, JSON.stringify(themeConfig, null, 2));
console.log('\n✅ Updated theme configuration');

console.log('\n🎉 OptiNook Digital Marketing theme created successfully!');
console.log('\n📝 Next steps:');
console.log('   1. Run "npm run categorize-articles" to recategorize all articles');
console.log('   2. Run "npm run build" to rebuild the site with new categories');