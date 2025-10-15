#!/usr/bin/env node

/**
 * 通用模板分类系统
 * 直接从config.template.js读取分类配置
 * 支持任何主题，无需额外配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 加载config.template.js中的分类配置
 */
async function loadTemplateCategorization() {
  const templatePath = path.join(__dirname, '../config.template.js');
  
  try {
    // 检查模板文件是否存在
    if (!fs.existsSync(templatePath)) {
      throw new Error('config.template.js not found');
    }
    
    // 读取模板文件内容
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // 创建临时文件来加载配置
    const tempFile = path.join(__dirname, `temp-config-${Date.now()}.js`);
    fs.writeFileSync(tempFile, templateContent);
    
    // 动态导入配置
    const tempFileUrl = `file:///${path.resolve(tempFile).replace(/\\/g, '/')}?t=${Date.now()}`;
    const configModule = await import(tempFileUrl);
    
    // 删除临时文件
    fs.unlinkSync(tempFile);
    
    const { CURRENT_WEBSITE_CONTENT, CATEGORY_INFO } = configModule;
    
    log(`🎨 加载主题: ${CURRENT_WEBSITE_CONTENT.theme?.name || CURRENT_WEBSITE_CONTENT.title}`, 'cyan');
    log(`📁 可用分类: ${CURRENT_WEBSITE_CONTENT.categories.length} 个`, 'blue');
    
    return {
      theme: CURRENT_WEBSITE_CONTENT.theme?.name || CURRENT_WEBSITE_CONTENT.title,
      categories: CURRENT_WEBSITE_CONTENT.categories || [],
      categoryInfo: CATEGORY_INFO || {},
      settings: {
        enableSmartCategorization: true,
        logCategoryDecisions: true,
        defaultCategory: CURRENT_WEBSITE_CONTENT.categories?.[0] || 'general'
      }
    };
    
  } catch (error) {
    log(`❌ 加载模板分类配置失败: ${error.message}`, 'red');
    log('💡 使用默认分类配置', 'yellow');
    
    // 返回默认配置
    return {
      theme: 'default',
      categories: ['general'],
      categoryInfo: {
        'general': {
          name: 'General',
          description: 'General articles'
        }
      },
      settings: {
        enableSmartCategorization: false,
        defaultCategory: 'general'
      }
    };
  }
}

/**
 * 从分类ID和信息中提取关键词
 */
function extractKeywords(categoryId, categoryInfo) {
  const keywords = new Set();
  
  // 1. 从分类ID提取关键词（分割横线）
  const idWords = categoryId.split('-');
  idWords.forEach(word => keywords.add(word.toLowerCase()));
  
  // 2. 从分类名称提取关键词
  if (categoryInfo.name) {
    const nameWords = categoryInfo.name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => keywords.add(word));
  }
  
  // 3. 从描述提取关键词
  if (categoryInfo.description) {
    const descWords = categoryInfo.description.toLowerCase().split(/\s+/);
    // 只取有意义的词（长度>2）
    descWords.forEach(word => {
      if (word.length > 2 && !['and', 'the', 'for', 'with', 'about'].includes(word)) {
        keywords.add(word.replace(/[.,!?]/g, ''));
      }
    });
  }
  
  // 4. 如果配置中有明确的关键词列表，添加它们
  if (categoryInfo.keywords && Array.isArray(categoryInfo.keywords)) {
    categoryInfo.keywords.forEach(keyword => keywords.add(keyword.toLowerCase()));
  }
  
  return Array.from(keywords);
}

/**
 * 智能分类文章
 * @param {string} title - 文章标题
 * @param {string} description - 文章描述
 * @param {string} content - 文章内容
 * @returns {Promise<string>} - 匹配的分类ID
 */
async function categorizeArticle(title, description, content) {
  const config = await loadTemplateCategorization();
  
  if (!config.settings.enableSmartCategorization) {
    return config.settings.defaultCategory;
  }
  
  const fullText = `${title} ${description} ${content}`.toLowerCase();
  
  // 计算每个分类的匹配分数
  const scores = {};
  
  for (const categoryId of config.categories) {
    const categoryInfo = config.categoryInfo[categoryId] || {};
    const keywords = extractKeywords(categoryId, categoryInfo);
    
    let score = 0;
    
    // 计算关键词匹配分数
    for (const keyword of keywords) {
      // 标题中的匹配权重更高
      const titleMatches = (title.toLowerCase().match(new RegExp(keyword, 'gi')) || []).length;
      score += titleMatches * 3;
      
      // 描述中的匹配
      const descMatches = (description.toLowerCase().match(new RegExp(keyword, 'gi')) || []).length;
      score += descMatches * 2;
      
      // 内容中的匹配
      const contentMatches = (fullText.match(new RegExp(keyword, 'gi')) || []).length;
      score += contentMatches;
    }
    
    scores[categoryId] = score;
    
    if (config.settings.logCategoryDecisions) {
      log(`  📊 ${categoryInfo.name || categoryId}: 分数 ${score} (关键词: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''})`, 'cyan');
    }
  }
  
  // 找出最高分的分类
  let bestCategory = config.settings.defaultCategory;
  let highestScore = 0;
  
  for (const [categoryId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = categoryId;
    }
  }
  
  // 如果没有任何匹配，使用默认分类
  if (highestScore === 0) {
    log(`  ⚠️  没有匹配的分类，使用默认: ${bestCategory}`, 'yellow');
  } else {
    const categoryInfo = config.categoryInfo[bestCategory] || {};
    log(`  ✅ 选择分类: ${categoryInfo.name || bestCategory} (分数: ${highestScore})`, 'green');
  }
  
  return bestCategory;
}

/**
 * 获取所有可用的分类
 */
async function getAvailableCategories() {
  const config = await loadTemplateCategorization();
  return config.categories;
}

/**
 * 获取分类信息
 */
async function getCategoryInfo(categoryId) {
  const config = await loadTemplateCategorization();
  return config.categoryInfo[categoryId] || {
    name: categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Articles about ${categoryId.replace(/-/g, ' ')}`
  };
}

// 导出函数
export {
  loadTemplateCategorization,
  categorizeArticle,
  getAvailableCategories,
  getCategoryInfo
};