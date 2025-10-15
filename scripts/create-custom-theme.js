#!/usr/bin/env node

/**
 * 创建自定义主题脚本
 * 帮助用户创建新的主题配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise化的question函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * 主题模板
 */
const themeTemplates = {
  'travel': {
    name: 'Travel & Adventure',
    categories: {
      'destinations': ['destination', 'city', 'country', 'place', 'visit'],
      'planning': ['planning', 'itinerary', 'budget', 'booking', 'tips'],
      'accommodation': ['hotel', 'accommodation', 'lodging', 'airbnb', 'resort'],
      'food-travel': ['food', 'cuisine', 'restaurant', 'local food'],
      'adventure': ['adventure', 'outdoor', 'hiking', 'climbing', 'diving'],
      'culture': ['culture', 'history', 'museum', 'tradition', 'local'],
      'travel-tips': ['tips', 'advice', 'guide', 'how to', 'travel hacks']
    }
  },
  
  'cooking': {
    name: 'Cooking & Food',
    categories: {
      'recipes': ['recipe', 'cooking', 'ingredients', 'preparation', 'dish'],
      'techniques': ['technique', 'skills', 'method', 'cooking tips'],
      'ingredients': ['ingredients', 'fresh', 'seasonal', 'organic', 'quality'],
      'cuisines': ['cuisine', 'italian', 'chinese', 'japanese', 'french'],
      'healthy-eating': ['healthy', 'nutrition', 'diet', 'wellness', 'balanced'],
      'baking': ['baking', 'bread', 'cake', 'pastry', 'dessert'],
      'food-tips': ['tips', 'advice', 'guide', 'food hacks', 'storage']
    }
  },
  
  'business': {
    name: 'Business & Entrepreneurship',
    categories: {
      'startup': ['startup', 'entrepreneur', 'business idea', 'founding'],
      'marketing': ['marketing', 'advertising', 'promotion', 'branding'],
      'finance': ['finance', 'investment', 'funding', 'money', 'budget'],
      'management': ['management', 'leadership', 'team', 'operations'],
      'productivity': ['productivity', 'efficiency', 'tools', 'workflow']
    }
  },
  
  'lifestyle': {
    name: 'Lifestyle & Wellness',
    categories: {
      'health': ['health', 'wellness', 'fitness', 'exercise', 'mental health'],
      'fashion': ['fashion', 'style', 'clothing', 'trends', 'outfit'],
      'home': ['home', 'decor', 'interior', 'design', 'organization'],
      'relationships': ['relationships', 'dating', 'family', 'friends'],
      'personal-growth': ['personal growth', 'self-improvement', 'mindset'],
      'hobbies': ['hobbies', 'crafts', 'diy', 'creative', 'art']
    }
  },
  
  'tech': {
    name: 'Technology & Programming',
    categories: {
      'programming': ['programming', 'coding', 'development', 'software'],
      'web-dev': ['web development', 'html', 'css', 'javascript', 'react'],
      'mobile': ['mobile', 'app', 'ios', 'android', 'flutter'],
      'data-science': ['data science', 'machine learning', 'analytics'],
      'devops': ['devops', 'cloud', 'deployment', 'infrastructure'],
      'tech-news': ['tech news', 'trends', 'innovation', 'gadgets']
    }
  }
};

/**
 * 显示主题模板选项
 */
function showThemeTemplates() {
  log('\n📋 可用主题模板:', 'cyan');
  log('─'.repeat(50), 'blue');
  
  Object.entries(themeTemplates).forEach(([id, template], index) => {
    log(`${index + 1}. ${id} - ${template.name}`, 'blue');
    log(`   分类: ${Object.keys(template.categories).join(', ')}`, 'reset');
    console.log();
  });
  
  log('0. custom - 创建完全自定义的主题', 'yellow');
}

/**
 * 创建自定义分类
 */
async function createCustomCategories() {
  const categories = {};
  
  log('\n🏷️  创建自定义分类 (输入 "done" 完成):', 'cyan');
  
  while (true) {
    const categoryId = await question('\n📂 输入分类ID (例: my-category): ');
    
    if (categoryId.toLowerCase() === 'done') {
      break;
    }
    
    if (!categoryId || !categoryId.match(/^[a-z0-9-]+$/)) {
      log('❌ 分类ID只能包含小写字母、数字和连字符', 'red');
      continue;
    }
    
    const categoryName = await question('📝 输入分类显示名称: ');
    const keywordsStr = await question('🔑 输入关键词 (用逗号分隔): ');
    
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    
    categories[categoryId] = {
      keywords: keywords,
      description: categoryName
    };
    
    log(`✅ 添加分类: ${categoryId} (${keywords.length} 个关键词)`, 'green');
  }
  
  return categories;
}

/**
 * 基于模板创建主题
 */
function createThemeFromTemplate(templateId) {
  const template = themeTemplates[templateId];
  const categories = {};
  
  for (const [categoryId, keywords] of Object.entries(template.categories)) {
    categories[categoryId] = {
      keywords: keywords,
      description: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  }
  
  return {
    name: template.name,
    description: `${template.name}主题`,
    categories: categories,
    defaultCategory: Object.keys(categories)[0]
  };
}

/**
 * 保存主题到配置文件
 */
function saveTheme(themeId, themeData) {
  const rulesPath = path.join(__dirname, '../config/categorization-rules.json');
  
  let rules = {};
  if (fs.existsSync(rulesPath)) {
    rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  }
  
  rules[themeId] = themeData;
  
  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
  log(`💾 主题已保存到: ${rulesPath}`, 'green');
}

/**
 * 主函数
 */
async function main() {
  log('🎨 自定义主题创建向导', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    const themeId = await question('📛 输入主题ID (例: my-travel-theme): ');
    
    if (!themeId || !themeId.match(/^[a-z0-9-]+$/)) {
      log('❌ 主题ID只能包含小写字母、数字和连字符', 'red');
      process.exit(1);
    }
    
    const themeName = await question('📝 输入主题显示名称: ');
    const themeDescription = await question('📄 输入主题描述: ');
    
    showThemeTemplates();
    
    const templateChoice = await question('\n🎯 选择模板 (输入数字或ID): ');
    
    let themeData;
    
    if (templateChoice === '0' || templateChoice.toLowerCase() === 'custom') {
      // 完全自定义
      log('\n🛠️  创建完全自定义主题...', 'yellow');
      const customCategories = await createCustomCategories();
      
      if (Object.keys(customCategories).length === 0) {
        log('❌ 至少需要创建一个分类', 'red');
        process.exit(1);
      }
      
      themeData = {
        name: themeName,
        description: themeDescription,
        categories: customCategories,
        defaultCategory: Object.keys(customCategories)[0]
      };
      
    } else {
      // 基于模板
      const templateKeys = Object.keys(themeTemplates);
      let selectedTemplate;
      
      if (templateChoice.match(/^\\d+$/)) {
        const index = parseInt(templateChoice) - 1;
        selectedTemplate = templateKeys[index];
      } else {
        selectedTemplate = templateChoice;
      }
      
      if (!themeTemplates[selectedTemplate]) {
        log('❌ 无效的模板选择', 'red');
        process.exit(1);
      }
      
      log(`\\n🎨 基于模板 "${selectedTemplate}" 创建主题...`, 'yellow');
      themeData = createThemeFromTemplate(selectedTemplate);
      themeData.name = themeName;
      themeData.description = themeDescription;
    }
    
    // 预览主题
    log('\\n👀 主题预览:', 'magenta');
    log(`📛 ID: ${themeId}`, 'blue');
    log(`📝 名称: ${themeData.name}`, 'blue');
    log(`📄 描述: ${themeData.description}`, 'blue');
    log(`📂 默认分类: ${themeData.defaultCategory}`, 'blue');
    log(`\\n🏷️  分类列表 (${Object.keys(themeData.categories).length}):`, 'cyan');
    
    for (const [categoryId, categoryData] of Object.entries(themeData.categories)) {
      log(`  • ${categoryId}: ${categoryData.description}`, 'green');
      log(`    关键词: ${categoryData.keywords.join(', ')}`, 'reset');
    }
    
    const confirm = await question('\\n❓ 确认创建此主题? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      log('❌ 用户取消操作', 'yellow');
      process.exit(0);
    }
    
    // 保存主题
    saveTheme(themeId, themeData);
    
    // 询问是否立即切换
    const switchNow = await question('\\n🔄 是否立即切换到新主题? (y/n): ');
    
    if (switchNow.toLowerCase() === 'y' || switchNow.toLowerCase() === 'yes') {
      const { switchTheme } = await import('./dynamic-categorization.js');
      const success = switchTheme(themeId);
      
      if (success) {
        log('\\n✅ 主题创建并切换成功！', 'green');
        log('\\n💡 接下来你可以:', 'yellow');
        log('  1. 运行 npm run add-articles-improved 添加新文章', 'cyan');
        log('  2. 运行 npm run categorize-articles 重新分类现有文章', 'cyan');
        log('  3. 运行 npm run theme-list 查看所有主题', 'cyan');
      }
    } else {
      log('\\n✅ 主题创建成功！', 'green');
      log(`💡 运行以下命令切换到新主题:`, 'yellow');
      log(`   npm run theme-switch ${themeId}`, 'cyan');
    }
    
  } catch (error) {
    log(`\\n❌ 创建主题失败: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();