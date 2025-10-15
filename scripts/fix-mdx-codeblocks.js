#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function fixCodeBlocks(content) {
  let modifiedContent = content;

  // 修复重复的CSS代码块标记 - 更复杂的模式
  modifiedContent = modifiedContent.replace(/```css\n```css\n```css/g, '```css');
  modifiedContent = modifiedContent.replace(/```css\n```css/g, '```css');

  // 修复重复的JavaScript代码块标记
  modifiedContent = modifiedContent.replace(/```javascript\n```javascript\n```javascript/g, '```javascript');
  modifiedContent = modifiedContent.replace(/```javascript\n```javascript/g, '```javascript');
  modifiedContent = modifiedContent.replace(/```js\n```js\n```js/g, '```js');
  modifiedContent = modifiedContent.replace(/```js\n```js/g, '```js');

  // 修复重复的HTML代码块标记
  modifiedContent = modifiedContent.replace(/```html\n```html\n```html/g, '```html');
  modifiedContent = modifiedContent.replace(/```html\n```html/g, '```html');

  // 修复重复的通用代码块标记
  modifiedContent = modifiedContent.replace(/```\n```\n```/g, '```');
  modifiedContent = modifiedContent.replace(/```\n```/g, '```');

  // 修复代码块内部的多余结束标记
  modifiedContent = modifiedContent.replace(/```\n```\n```\n```/g, '```\n```');
  modifiedContent = modifiedContent.replace(/```\n```\n```/g, '```\n```');

  // 修复代码块内部的重复开始标记
  modifiedContent = modifiedContent.replace(/```css\n```css\n```css\n```css/g, '```css');
  modifiedContent = modifiedContent.replace(/```javascript\n```javascript\n```javascript\n```javascript/g, '```javascript');
  modifiedContent = modifiedContent.replace(/```js\n```js\n```js\n```js/g, '```js');
  modifiedContent = modifiedContent.replace(/```html\n```html\n```html\n```html/g, '```html');

  // 修复代码块内部的嵌套问题
  modifiedContent = modifiedContent.replace(/```css\n```css\n([^`]+)\n```\n```/g, '```css\n$1\n```');
  modifiedContent = modifiedContent.replace(/```javascript\n```javascript\n([^`]+)\n```\n```/g, '```javascript\n$1\n```');
  modifiedContent = modifiedContent.replace(/```js\n```js\n([^`]+)\n```\n```/g, '```js\n$1\n```');
  modifiedContent = modifiedContent.replace(/```html\n```html\n([^`]+)\n```\n```/g, '```html\n$1\n```');

  // 修复代码块内部的重复结束标记
  modifiedContent = modifiedContent.replace(/```\n```\n```\n```\n```/g, '```\n```');
  modifiedContent = modifiedContent.replace(/```\n```\n```\n```/g, '```\n```');

  return modifiedContent;
}

function processMdxFile(filePath) {
  try {
    console.log(`🔧 处理文件: ${path.basename(filePath)}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = fixCodeBlocks(content);

    if (content !== modifiedContent) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✅ 已修复: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`📋 无需修复: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

function fixCodeBlocksInArticles() {
  console.log('🔧 代码块修复脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let filesFixed = 0;
  let totalFiles = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        totalFiles++;
        const wasFixed = processMdxFile(mdxPath);
        if (wasFixed) {
          filesFixed++;
        }
      }
    }
  }

  console.log('\n📊 修复结果摘要:');
  console.log(`📁 总文件数: ${totalFiles}`);
  console.log(`🔧 已修复: ${filesFixed}`);
  console.log(`📋 无需修复: ${totalFiles - filesFixed}`);

  if (filesFixed > 0) {
    console.log('\n🎉 代码块修复完成！');
    console.log('💡 所有重复的代码块标记已清理');
  } else {
    console.log('\n📝 没有发现需要修复的代码块问题');
  }
}

fixCodeBlocksInArticles(); 