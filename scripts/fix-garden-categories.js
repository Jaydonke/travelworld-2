#!/usr/bin/env node

/**
 * 修复园艺分类文件格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES_DIR = path.join(__dirname, '../src/content/categories');

// 园艺分类配置
const gardenCategories = {
  'urban-gardening': {
    title: 'Urban Gardening',
    path: 'urban-gardening'
  },
  'sustainable-gardening': {
    title: 'Sustainable Gardening',
    path: 'sustainable-gardening'
  },
  'vegetable-gardening': {
    title: 'Vegetable Gardening',
    path: 'vegetable-gardening'
  },
  'garden-design': {
    title: 'Garden Design',
    path: 'garden-design'
  },
  'plant-care': {
    title: 'Plant Care',
    path: 'plant-care'
  },
  'specialty-gardens': {
    title: 'Specialty Gardens',
    path: 'specialty-gardens'
  },
  'garden-technology': {
    title: 'Garden Technology',
    path: 'garden-technology'
  },
  'seasonal-gardening': {
    title: 'Seasonal Gardening',
    path: 'seasonal-gardening'
  },
  'diy-projects': {
    title: 'DIY Projects',
    path: 'diy-projects'
  },
  'garden-basics': {
    title: 'Garden Basics',
    path: 'garden-basics'
  }
};

function fixCategories() {
  console.log('🌿 Fixing garden category files...\n');
  
  for (const [categoryId, categoryData] of Object.entries(gardenCategories)) {
    const categoryPath = path.join(CATEGORIES_DIR, categoryId);
    const indexPath = path.join(categoryPath, 'index.json');
    
    if (fs.existsSync(indexPath)) {
      // 更新为正确的格式
      const content = {
        title: categoryData.title,
        path: categoryData.path
      };
      
      fs.writeFileSync(indexPath, JSON.stringify(content, null, 2));
      console.log(`✅ Fixed: ${categoryId}/index.json`);
    } else if (fs.existsSync(categoryPath)) {
      // 创建index.json如果不存在
      const content = {
        title: categoryData.title,
        path: categoryData.path
      };
      
      fs.writeFileSync(indexPath, JSON.stringify(content, null, 2));
      console.log(`✅ Created: ${categoryId}/index.json`);
    } else {
      // 创建整个目录和文件
      fs.mkdirSync(categoryPath, { recursive: true });
      const content = {
        title: categoryData.title,
        path: categoryData.path
      };
      
      fs.writeFileSync(indexPath, JSON.stringify(content, null, 2));
      console.log(`✅ Created directory and file: ${categoryId}/index.json`);
    }
  }
  
  console.log('\n✨ All garden categories fixed!');
}

// 运行
fixCategories();