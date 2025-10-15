#!/usr/bin/env node

/**
 * 修复现有文章中的表格格式问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixTableFormatting(content) {
  // 修复表格格式问题
  content = content.replace(/(\|[^\n]+\|\n(?:[^\n]*\n)*)/g, (tableMatch) => {
    const lines = tableMatch.trim().split('\n').filter(line => line.trim());
    const result = [];
    let headerFound = false;
    let separatorFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isSeparatorLine = /^\|\s*(?:---+\s*\|\s*)+---+\s*\|?$/.test(line);
      const isTableRow = /^\|.*\|$/.test(line);

      if (!isTableRow && !isSeparatorLine) {
        // 不是表格行，保留原样
        result.push(line);
        continue;
      }

      if (!headerFound && isTableRow && !isSeparatorLine) {
        // 第一个数据行是表头
        result.push(line);
        headerFound = true;
      } else if (headerFound && !separatorFound && isSeparatorLine) {
        // 紧跟表头后的第一个分隔符行
        result.push(line);
        separatorFound = true;
      } else if (separatorFound && isTableRow && !isSeparatorLine) {
        // 数据行
        result.push(line);
      }
      // 忽略其他所有分隔符行
    }

    return result.join('\n') + '\n\n';
  });

  // 移除表格行之间的空行
  content = content.replace(/(\|[^\n]+\|)\n\n+(\|[^\n]+\|)/g, '$1\n$2');

  return content;
}

function fixMDXFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // 分离frontmatter和正文
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    console.log(`跳过没有frontmatter的文件: ${filePath}`);
    return false;
  }

  const frontmatter = frontmatterMatch[0];
  const body = content.substring(frontmatter.length);

  // 修复正文中的表格
  const fixedBody = fixTableFormatting(body);

  if (body !== fixedBody) {
    // 只有在内容有变化时才写入文件
    const fixedContent = frontmatter + fixedBody;
    fs.writeFileSync(filePath, fixedContent, 'utf-8');
    return true;
  }

  return false;
}

function getAllMDXFiles(dir) {
  const files = [];

  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item === 'index.mdx') {
        files.push(fullPath);
      }
    }
  }

  if (fs.existsSync(dir)) {
    walkDir(dir);
  }

  return files;
}

async function main() {
  console.log('🔧 开始修复文章中的表格格式问题...\n');

  // 查找所有MDX文件
  const blogDir = path.join(__dirname, '../src/content/blog');
  const files = getAllMDXFiles(blogDir);

  console.log(`找到 ${files.length} 个MDX文件\n`);

  let fixedCount = 0;
  for (const file of files) {
    const filename = path.basename(path.dirname(file));
    process.stdout.write(`处理: ${filename}...`);

    if (fixMDXFile(file)) {
      process.stdout.write(' ✅ 已修复\n');
      fixedCount++;
    } else {
      process.stdout.write(' ⏭️  无需修复\n');
    }
  }

  console.log(`\n✨ 完成！修复了 ${fixedCount} 个文件的表格格式`);
}

main().catch(console.error);