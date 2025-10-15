#!/usr/bin/env node

/**
 * 更新分类规则以匹配实际存在的分类
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取实际存在的分类
const categoriesDir = path.join(__dirname, '../src/content/categories');
const actualCategories = fs.readdirSync(categoriesDir)
  .filter(dir => fs.statSync(path.join(categoriesDir, dir)).isDirectory());

console.log('实际存在的分类：', actualCategories);

// 创建新的分类规则
const newRules = {
  "theme": "blogging-monetization",
  "categories": {}
};

// 分类映射和关键词
const categoryData = {
  "affiliate-marketing": {
    "title": "Affiliate Marketing",
    "description": "Learn how to monetize your blog through affiliate partnerships",
    "keywords": ["affiliate", "commission", "partner", "referral", "amazon", "associate", "link", "product", "recommendation"]
  },
  "audience-growth": {
    "title": "Audience Growth",
    "description": "Strategies to grow and engage your blog audience",
    "keywords": ["audience", "traffic", "visitors", "growth", "engagement", "community", "followers", "subscribers"]
  },
  "blog-monetization": {
    "title": "Blog Monetization",
    "description": "Strategies to generate income from your blog",
    "keywords": ["monetize", "revenue", "income", "earnings", "profit", "money", "ads", "sponsored"]
  },
  "blogging-tools": {
    "title": "Blogging Tools",
    "description": "Essential tools and resources for bloggers",
    "keywords": ["tools", "software", "apps", "plugins", "resources", "platform", "hosting", "wordpress"]
  },
  "content-strategy": {
    "title": "Content Strategy",
    "description": "Plan and create content that engages your audience",
    "keywords": ["content", "strategy", "planning", "editorial", "calendar", "topics", "writing", "blog", "post", "article"]
  },
  "email-marketing": {
    "title": "Email Marketing",
    "description": "Build and monetize your email list",
    "keywords": ["email", "newsletter", "list", "subscribers", "campaign", "mailchimp", "convertkit", "autoresponder"]
  },
  "general": {
    "title": "General",
    "description": "General blogging tips and advice",
    "keywords": ["blog", "blogging", "tips", "advice", "guide", "tutorial", "how-to"]
  },
  "growth-hacking": {
    "title": "Growth Hacking",
    "description": "Innovative strategies for rapid growth",
    "keywords": ["growth", "hack", "viral", "scale", "rapid", "innovative", "experiment", "optimization"]
  },
  "marketing-automation": {
    "title": "Marketing Automation",
    "description": "Automate your marketing processes",
    "keywords": ["automation", "automate", "workflow", "zapier", "integration", "efficiency", "process", "system"]
  },
  "seo-optimization": {
    "title": "SEO Optimization",
    "description": "Improve your blog visibility in search engines",
    "keywords": ["seo", "search", "google", "ranking", "keywords", "optimization", "organic", "backlinks", "serp"]
  }
};

// 为每个实际存在的分类创建规则
actualCategories.forEach(category => {
  if (categoryData[category]) {
    newRules.categories[category] = {
      title: categoryData[category].title,
      path: category,
      description: categoryData[category].description,
      keywords: categoryData[category].keywords
    };
  } else {
    // 如果没有预定义数据，创建基础数据
    const title = category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    newRules.categories[category] = {
      title: title,
      path: category,
      description: `Articles about ${title.toLowerCase()}`,
      keywords: category.split('-')
    };
  }
});

// 保存新规则
const rulesPath = path.join(__dirname, 'categorization-rules.json');
fs.writeFileSync(rulesPath, JSON.stringify(newRules, null, 2));

console.log('\n✅ 分类规则已更新！');
console.log('包含的分类：', Object.keys(newRules.categories));