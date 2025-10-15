#!/usr/bin/env node

/**
 * 创建园艺主题并更新分类
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_DIR = path.join(__dirname, '../config');
const CATEGORIES_DIR = path.join(__dirname, '../src/content/categories');

// 园艺主题配置
const gardeningTheme = {
  "name": "Green Garden Theme",
  "description": "Gardening, sustainable living, and eco-friendly practices",
  "categories": {
    "urban-gardening": {
      "keywords": [
        "urban", "balcony", "micro", "city", "small space", "apartment",
        "container", "rooftop", "vertical", "indoor"
      ],
      "description": "Urban Gardening & Small Spaces"
    },
    "sustainable-gardening": {
      "keywords": [
        "sustainable", "eco-friendly", "organic", "permaculture", "climate-smart",
        "water-saving", "low-water", "drought-resistant", "rainwater", "composting",
        "mulching", "no-dig", "conservation"
      ],
      "description": "Sustainable & Eco-Friendly Gardening"
    },
    "vegetable-gardening": {
      "keywords": [
        "vegetable", "veggie", "edible", "food", "harvest", "crop",
        "tomato", "lettuce", "herbs", "kitchen garden", "raised bed"
      ],
      "description": "Vegetable & Herb Gardening"
    },
    "garden-design": {
      "keywords": [
        "design", "landscape", "layout", "planning", "aesthetic", "beautiful",
        "ornamental", "border", "pathway", "zones", "sensory", "themed"
      ],
      "description": "Garden Design & Landscaping"
    },
    "plant-care": {
      "keywords": [
        "care", "maintenance", "pruning", "watering", "fertilizing", "pest",
        "disease", "soil", "planting", "growing", "cultivation", "propagation"
      ],
      "description": "Plant Care & Maintenance"
    },
    "specialty-gardens": {
      "keywords": [
        "mushroom", "succulent", "cactus", "orchid", "native", "wildflower",
        "pollinator", "butterfly", "bee", "bug-friendly", "habitat", "restoration"
      ],
      "description": "Specialty Gardens & Plants"
    },
    "garden-technology": {
      "keywords": [
        "smart", "sensor", "automation", "technology", "app", "monitoring",
        "irrigation", "greenhouse", "hydroponic", "aeroponic", "LED"
      ],
      "description": "Garden Technology & Innovation"
    },
    "seasonal-gardening": {
      "keywords": [
        "seasonal", "spring", "summer", "fall", "winter", "autumn",
        "planting calendar", "schedule", "timing", "frost", "heat", "climate"
      ],
      "description": "Seasonal Gardening Tips"
    },
    "diy-projects": {
      "keywords": [
        "diy", "build", "create", "homemade", "craft", "project",
        "planter", "trellis", "compost bin", "greenhouse", "self-watering"
      ],
      "description": "DIY Garden Projects"
    },
    "garden-basics": {
      "keywords": [
        "beginner", "basics", "introduction", "guide", "how-to", "tips",
        "getting started", "fundamental", "essential", "learn"
      ],
      "description": "Gardening Basics & Guides"
    }
  }
};

// 创建分类目录
function createCategoryDirectories() {
  console.log('🌱 Creating garden category directories...\n');
  
  for (const [categoryId, categoryData] of Object.entries(gardeningTheme.categories)) {
    const categoryPath = path.join(CATEGORIES_DIR, categoryId);
    
    // 创建目录
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
      console.log(`✅ Created directory: ${categoryId}`);
    } else {
      console.log(`⏭️  Directory exists: ${categoryId}`);
    }
    
    // 创建 index.json
    const indexPath = path.join(categoryPath, 'index.json');
    const indexContent = {
      id: categoryId,
      name: categoryData.description,
      description: `Articles about ${categoryData.description.toLowerCase()}`,
      keywords: categoryData.keywords
    };
    
    fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
    console.log(`   📝 Created index.json for ${categoryId}`);
  }
}

// 更新分类规则配置
function updateCategorizationRules() {
  console.log('\n📋 Updating categorization rules...');
  
  const rulesPath = path.join(CONFIG_DIR, 'categorization-rules.json');
  let rules = {};
  
  if (fs.existsSync(rulesPath)) {
    rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
  
  // 添加园艺主题
  rules['green-garden-theme'] = gardeningTheme;
  
  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
  console.log('✅ Updated categorization-rules.json');
}

// 更新主题配置
function updateThemeConfig() {
  console.log('\n🎨 Updating theme configuration...');
  
  const themePath = path.join(CONFIG_DIR, 'theme-config.json');
  const themeConfig = {
    "currentTheme": "green-garden-theme",
    "fallbackTheme": "garden-basics",
    "themeSettings": {
      "enableSmartCategorization": true,
      "enableManualOverride": true,
      "logCategoryDecisions": true
    }
  };
  
  fs.writeFileSync(themePath, JSON.stringify(themeConfig, null, 2));
  console.log('✅ Updated theme-config.json to green-garden-theme');
}

// 主函数
function main() {
  console.log('🌿 Setting up Green Garden Theme\n');
  console.log('='.repeat(50));
  
  // 1. 创建分类目录
  createCategoryDirectories();
  
  // 2. 更新分类规则
  updateCategorizationRules();
  
  // 3. 更新主题配置
  updateThemeConfig();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Garden theme setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run: node scripts/categorize-articles.js');
  console.log('2. Build the site: npm run build');
}

// 运行
main();