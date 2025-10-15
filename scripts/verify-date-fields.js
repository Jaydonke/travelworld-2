#!/usr/bin/env node

/**
 * 验证日期字段处理
 * 确保 publishedTime 和 pubDate 都能正确处理
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/blog');

console.log('🔍 验证日期字段处理...\n');

// 统计不同日期字段的使用情况
let publishedTimeCount = 0;
let pubDateCount = 0;
let bothCount = 0;
let noneCount = 0;
let invalidDates = [];

// 读取所有文章
const articles = fs.readdirSync(articlesDir).filter(dir => {
  const fullPath = path.join(articlesDir, dir);
  return fs.statSync(fullPath).isDirectory();
});

articles.forEach(article => {
  const mdxPath = path.join(articlesDir, article, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    console.log(`⚠️  文章目录没有 index.mdx: ${article}`);
    return;
  }
  
  const content = fs.readFileSync(mdxPath, 'utf8');
  
  // 检查日期字段
  const publishedTimeMatch = content.match(/publishedTime:\s*(.+)/);
  const pubDateMatch = content.match(/pubDate:\s*(.+)/);
  
  let hasPublishedTime = false;
  let hasPubDate = false;
  let dateValue = null;
  
  if (publishedTimeMatch) {
    hasPublishedTime = true;
    dateValue = publishedTimeMatch[1];
    publishedTimeCount++;
  }
  
  if (pubDateMatch) {
    hasPubDate = true;
    dateValue = pubDateMatch[1];
    pubDateCount++;
  }
  
  if (hasPublishedTime && hasPubDate) {
    bothCount++;
  } else if (!hasPublishedTime && !hasPubDate) {
    noneCount++;
    console.log(`❌ 没有日期字段: ${article}`);
  }
  
  // 验证日期格式
  if (dateValue) {
    try {
      const date = new Date(dateValue.trim());
      if (isNaN(date.getTime())) {
        invalidDates.push({
          article,
          value: dateValue,
          field: hasPublishedTime ? 'publishedTime' : 'pubDate'
        });
      }
    } catch (error) {
      invalidDates.push({
        article,
        value: dateValue,
        field: hasPublishedTime ? 'publishedTime' : 'pubDate',
        error: error.message
      });
    }
  }
});

// 显示统计结果
console.log('\n📊 日期字段统计:');
console.log('='.repeat(50));
console.log(`总文章数: ${articles.length}`);
console.log(`使用 publishedTime: ${publishedTimeCount}`);
console.log(`使用 pubDate: ${pubDateCount}`);
console.log(`同时使用两个字段: ${bothCount}`);
console.log(`没有日期字段: ${noneCount}`);

if (invalidDates.length > 0) {
  console.log('\n❌ 无效的日期格式:');
  console.log('='.repeat(50));
  invalidDates.forEach(item => {
    console.log(`文章: ${item.article}`);
    console.log(`字段: ${item.field}`);
    console.log(`值: ${item.value}`);
    if (item.error) {
      console.log(`错误: ${item.error}`);
    }
    console.log('-'.repeat(30));
  });
}

// 建议
console.log('\n💡 建议:');
console.log('='.repeat(50));

if (noneCount > 0) {
  console.log('⚠️  有文章缺少日期字段，需要添加 publishedTime 或 pubDate');
}

if (bothCount > 0) {
  console.log('⚠️  有文章同时使用两个日期字段，建议统一使用 publishedTime');
}

if (pubDateCount > 0 && publishedTimeCount > 0) {
  console.log('💡 建议统一使用 publishedTime 字段以保持一致性');
}

if (invalidDates.length > 0) {
  console.log('❌ 有无效的日期格式需要修复');
}

if (noneCount === 0 && invalidDates.length === 0) {
  console.log('✅ 所有文章都有有效的日期字段！');
}

// 检查脚本中的日期处理
console.log('\n🔧 检查脚本配置:');
console.log('='.repeat(50));

// 检查 content.config.ts
const configPath = path.join(__dirname, '../src/content.config.ts');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  if (configContent.includes('publishedTime') && configContent.includes('pubDate')) {
    console.log('✅ content.config.ts 支持两种日期字段');
  } else {
    console.log('⚠️  content.config.ts 可能不完全支持两种日期字段');
  }
}

// 检查 blogUtils.ts
const utilsPath = path.join(__dirname, '../src/js/blogUtils.ts');
if (fs.existsSync(utilsPath)) {
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');
  if (utilsContent.includes('publishedTime || post.data.pubDate')) {
    console.log('✅ blogUtils.ts 正确处理两种日期字段');
  } else {
    console.log('⚠️  blogUtils.ts 可能需要更新以处理两种日期字段');
  }
}

console.log('\n✨ 验证完成！');