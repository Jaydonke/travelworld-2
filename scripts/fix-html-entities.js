#!/usr/bin/env node

/**
 * 修复MDX文件中的HTML实体编码
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../src/content/blog');

// HTML实体映射
const htmlEntities = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™'
};

function decodeHtmlEntities(text) {
  let decoded = text;
  for (const [entity, char] of Object.entries(htmlEntities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  return decoded;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 只处理frontmatter部分
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return false;
  }
  
  const frontmatter = frontmatterMatch[1];
  const rest = content.slice(frontmatterMatch[0].length);
  
  // 检查是否包含HTML实体
  let hasEntities = false;
  for (const entity of Object.keys(htmlEntities)) {
    if (frontmatter.includes(entity)) {
      hasEntities = true;
      break;
    }
  }
  
  if (!hasEntities) {
    return false;
  }
  
  // 解码frontmatter中的HTML实体
  const decodedFrontmatter = decodeHtmlEntities(frontmatter);
  
  // 重新组合文件内容
  const newContent = `---\n${decodedFrontmatter}\n---${rest}`;
  
  // 写回文件
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return true;
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      fixedCount += processDirectory(fullPath);
    } else if (entry.name === 'index.mdx') {
      if (processFile(fullPath)) {
        console.log(`✅ 修复: ${path.relative(CONTENT_DIR, fullPath)}`);
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

console.log('🔍 开始扫描并修复HTML实体编码...\n');

const totalFixed = processDirectory(CONTENT_DIR);

console.log(`\n✨ 完成！共修复 ${totalFixed} 个文件`);