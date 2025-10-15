#!/usr/bin/env node

/**
 * Dynamic Categorization System
 * Supports intelligent article categorization with multiple themes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color output
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
 * Load categorization rules
 */
function loadCategorizationRules() {
  const rulesPath = path.join(__dirname, '../config/categorization-rules.json');
  const themeConfigPath = path.join(__dirname, '../config/theme-config.json');
  
  try {
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const themeConfig = JSON.parse(fs.readFileSync(themeConfigPath, 'utf8'));
    
    const currentTheme = themeConfig.currentTheme || 'ai-theme';
    
    if (!rules[currentTheme]) {
      log(`⚠️  Theme "${currentTheme}" not found, using default theme`, 'yellow');
      const fallbackTheme = themeConfig.fallbackTheme || 'ai-theme';
      return {
        theme: fallbackTheme,
        rules: rules[fallbackTheme],
        settings: themeConfig.themeSettings || {}
      };
    }
    
    log(`🎨 Using theme: ${rules[currentTheme].name}`, 'cyan');
    return {
      theme: currentTheme,
      rules: rules[currentTheme],
      settings: themeConfig.themeSettings || {}
    };
    
  } catch (error) {
    log(`❌ Failed to load categorization rules: ${error.message}`, 'red');
    log('💡 Will use built-in default rules', 'yellow');
    
    // Return built-in AI theme as fallback
    return {
      theme: 'ai-theme',
      rules: {
        categories: {
          'ai-tools': {
            keywords: ['tools', 'ai', 'technology'],
            description: 'AI Tools and Applications'
          },
          'productivity': {
            keywords: ['productivity', 'efficiency'],
            description: 'Productivity'
          }
        },
        defaultCategory: 'ai-tools'
      },
      settings: { enableSmartCategorization: true }
    };
  }
}

/**
 * Intelligently categorize article
 */
function categorizeArticle(title, description, content, rules, settings) {
  const fullText = (title + ' ' + description + ' ' + content).toLowerCase();
  
  if (!settings.enableSmartCategorization) {
    return rules.defaultCategory;
  }
  
  // Calculate matching score for each category
  const scores = {};
  
  for (const [categoryId, rule] of Object.entries(rules.categories)) {
    let score = 0;
    
    for (const keyword of rule.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = fullText.match(regex) || [];
      
      // Matches in title have higher weight
      const titleMatches = title.toLowerCase().match(regex) || [];
      
      score += matches.length + (titleMatches.length * 2);
    }
    
    scores[categoryId] = score;
  }
  
  // Find the category with highest score
  const bestCategory = Object.keys(scores).reduce((a, b) => 
    scores[a] > scores[b] ? a : b
  );
  
  // Log decision process
  if (settings.logCategoryDecisions) {
    log(`  📊 Category scores:`, 'blue');
    for (const [category, score] of Object.entries(scores)) {
      const marker = category === bestCategory ? '🎯' : '  ';
      log(`    ${marker} ${category}: ${score} points`, score > 0 ? 'green' : 'reset');
    }
  }
  
  // If highest score is 0, use default category
  if (scores[bestCategory] === 0) {
    log(`  💡 No matching keywords found, using default category: ${rules.defaultCategory}`, 'yellow');
    return rules.defaultCategory;
  }
  
  return bestCategory;
}

/**
 * Get all categories of current theme
 */
function getCurrentThemeCategories() {
  const { rules } = loadCategorizationRules();
  return Object.keys(rules.categories);
}

/**
 * Switch theme
 */
function switchTheme(newTheme) {
  const themeConfigPath = path.join(__dirname, '../config/theme-config.json');
  const rulesPath = path.join(__dirname, '../config/categorization-rules.json');
  
  try {
    // Check if new theme exists
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    if (!rules[newTheme]) {
      log(`❌ Theme "${newTheme}" does not exist`, 'red');
      log(`📋 Available themes:`, 'cyan');
      Object.keys(rules).forEach(theme => {
        log(`  - ${theme}: ${rules[theme].name}`, 'blue');
      });
      return false;
    }
    
    // Update theme configuration
    const themeConfig = JSON.parse(fs.readFileSync(themeConfigPath, 'utf8'));
    themeConfig.currentTheme = newTheme;
    
    fs.writeFileSync(themeConfigPath, JSON.stringify(themeConfig, null, 2));
    
    log(`✅ Switched to theme: ${rules[newTheme].name}`, 'green');
    return true;
    
  } catch (error) {
    log(`❌ Failed to switch theme: ${error.message}`, 'red');
    return false;
  }
}

/**
 * List all available themes
 */
function listAvailableThemes() {
  const rulesPath = path.join(__dirname, '../config/categorization-rules.json');
  
  try {
    const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const { theme: currentTheme } = loadCategorizationRules();
    
    log('🎨 Available themes:', 'cyan');
    for (const [themeId, themeData] of Object.entries(rules)) {
      const marker = themeId === currentTheme ? '🎯' : '  ';
      log(`${marker} ${themeId}: ${themeData.name}`, themeId === currentTheme ? 'green' : 'blue');
      log(`    📝 ${themeData.description}`, 'reset');
      log(`    📂 Categories: ${Object.keys(themeData.categories).join(', ')}`, 'reset');
      console.log();
    }
    
  } catch (error) {
    log(`❌ Failed to read theme list: ${error.message}`, 'red');
  }
}

// Command line interface
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const command = process.argv[2];
  
  switch (command) {
    case 'switch':
      const newTheme = process.argv[3];
      if (!newTheme) {
        log('❌ Please specify the theme to switch to', 'red');
        log('💡 Usage: node dynamic-categorization.js switch <theme-name>', 'yellow');
      } else {
        switchTheme(newTheme);
      }
      break;
      
    case 'list':
      listAvailableThemes();
      break;
      
    case 'current':
      const { theme, rules } = loadCategorizationRules();
      log(`🎯 Current theme: ${theme}`, 'green');
      log(`📝 Description: ${rules.description || 'No description'}`, 'blue');
      log(`📂 Categories (${Object.keys(rules.categories).length}):`, 'cyan');
      for (const [categoryId, categoryData] of Object.entries(rules.categories)) {
        log(`  - ${categoryId}: ${categoryData.description}`, 'blue');
      }
      break;
      
    default:
      log('🔧 Dynamic Categorization System', 'cyan');
      log('', 'reset');
      log('Available commands:', 'yellow');
      log('  current  - Show current theme information', 'blue');
      log('  list     - List all available themes', 'blue');
      log('  switch   - Switch theme', 'blue');
      log('', 'reset');
      log('Examples:', 'yellow');
      log('  node dynamic-categorization.js current', 'cyan');
      log('  node dynamic-categorization.js list', 'cyan');
      log('  node dynamic-categorization.js switch travel-theme', 'cyan');
  }
}

export { 
  loadCategorizationRules, 
  categorizeArticle, 
  getCurrentThemeCategories, 
  switchTheme, 
  listAvailableThemes 
};