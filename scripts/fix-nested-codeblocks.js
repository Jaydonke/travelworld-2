#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function fixNestedCodeblocks(content) {
  let modifiedContent = content;

  // 修复复杂的嵌套CSS代码块模式
  // 匹配: ```css\n@media (min-width: 768px) {\n\n```css\n.container {\n...\n}\n```\n\n}\n```
  modifiedContent = modifiedContent.replace(
    /```css\n([\s\S]*?)```css\n([\s\S]*?)```\n([\s\S]*?)```/g,
    '```css\n$1$2$3```'
  );

  // 修复嵌套的CSS代码块
  modifiedContent = modifiedContent.replace(
    /```css\n```css\n([\s\S]*?)```\n```/g,
    '```css\n$1```'
  );

  // 修复嵌套的JavaScript代码块
  modifiedContent = modifiedContent.replace(
    /```javascript\n```javascript\n([\s\S]*?)```\n```/g,
    '```javascript\n$1```'
  );

  // 修复嵌套的JS代码块
  modifiedContent = modifiedContent.replace(
    /```js\n```js\n([\s\S]*?)```\n```/g,
    '```js\n$1```'
  );

  // 修复嵌套的HTML代码块
  modifiedContent = modifiedContent.replace(
    /```html\n```html\n([\s\S]*?)```\n```/g,
    '```html\n$1```'
  );

  // 修复嵌套的通用代码块
  modifiedContent = modifiedContent.replace(
    /```\n```\n([\s\S]*?)```\n```/g,
    '```\n$1```'
  );

  // 清理多余的代码块标记
  modifiedContent = modifiedContent.replace(/```css\n```css/g, '```css');
  modifiedContent = modifiedContent.replace(/```javascript\n```javascript/g, '```javascript');
  modifiedContent = modifiedContent.replace(/```js\n```js/g, '```js');
  modifiedContent = modifiedContent.replace(/```html\n```html/g, '```html');
  modifiedContent = modifiedContent.replace(/```\n```/g, '```');

  return modifiedContent;
}

function processArticle(articlePath) {
  try {
    const mdxPath = path.join(articlePath, 'index.mdx');
    if (!fs.existsSync(mdxPath)) {
      return false;
    }

    const content = fs.readFileSync(mdxPath, 'utf8');
    const originalContent = content;
    const fixedContent = fixNestedCodeblocks(content);

    if (originalContent !== fixedContent) {
      fs.writeFileSync(mdxPath, fixedContent);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(articlePath)} - ${error.message}`);
    return false;
  }
}

function fixAllNestedCodeblocks() {
  console.log('🔧 修复嵌套代码块标记');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let fixedCount = 0;
  let totalArticles = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalArticles++;
      const wasFixed = processArticle(fullPath);
      if (wasFixed) {
        console.log(`✅ 已修复: ${item}`);
        fixedCount++;
      } else {
        console.log(`📋 无需修复: ${item}`);
      }
    }
  }

  console.log('\n📊 修复结果摘要:');
  console.log(`📁 总文章数: ${totalArticles}`);
  console.log(`🔧 修复文章数: ${fixedCount}`);

  if (fixedCount > 0) {
    console.log('\n🎉 嵌套代码块标记修复完成！');
  } else {
    console.log('\n📝 没有发现需要修复的嵌套代码块标记');
  }
}

fixAllNestedCodeblocks(); 