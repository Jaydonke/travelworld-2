#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLES_DIR = path.join(__dirname, 'src/content/articles');

function fixYamlFrontmatter(content) {
  // 使用正则表达式匹配frontmatter
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) return content;

  const frontmatter = match[1];
  const lines = frontmatter.split('\n');
  const fixedLines = [];

  for (const line of lines) {
    if (line.includes('description:') || line.includes('title:')) {
      // 为包含特殊字符的字段添加引号
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex + 1);
        const value = line.substring(colonIndex + 1).trim();

        // 如果值不包含引号，则添加引号
        if (!value.startsWith('"') && !value.startsWith("'")) {
          fixedLines.push(`${key} "${value}"`);
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    } else {
      fixedLines.push(line);
    }
  }

  const fixedFrontmatter = fixedLines.join('\n');
  return content.replace(frontmatterRegex, `---\n${fixedFrontmatter}\n---\n\n`);
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item === 'index.mdx') {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fixedContent = fixYamlFrontmatter(content);

        if (content !== fixedContent) {
          fs.writeFileSync(fullPath, fixedContent);
          console.log(`✅ 修复: ${fullPath}`);
        }
      } catch (error) {
        console.error(`❌ 处理失败 ${fullPath}: ${error.message}`);
      }
    }
  }
}

console.log('🔧 开始修复YAML格式问题...');
processDirectory(ARTICLES_DIR);
console.log('🎉 YAML格式修复完成！'); 