#!/usr/bin/env node

/**
 * 移除文章中不相关的投资表格内容
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeIrrelevantTables(content) {
  // 移除包含投资相关内容的表格
  const investmentTablePattern = /\|[^\n]*(?:accredited investors|Minimum Investment|Lock-up periods|Transaction Speed)[^\n]*\|[\s\S]*?(?=\n(?:[^|]|\n\n))/g;

  // 查找并移除整个投资相关表格
  content = content.replace(investmentTablePattern, '');

  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');

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

  // 检查是否包含不相关的投资内容
  if (body.includes('accredited investors') || body.includes('Minimum Investment')) {
    // 移除不相关的表格
    const fixedBody = removeIrrelevantTables(body);

    if (body !== fixedBody) {
      // 只有在内容有变化时才写入文件
      const fixedContent = frontmatter + fixedBody;
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      return true;
    }
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
  console.log('🔧 开始移除文章中的不相关投资表格...\n');

  // 查找所有MDX文件
  const blogDir = path.join(__dirname, '../src/content/blog');
  const files = getAllMDXFiles(blogDir);

  console.log(`找到 ${files.length} 个MDX文件\n`);

  let fixedCount = 0;
  for (const file of files) {
    const filename = path.basename(path.dirname(file));
    process.stdout.write(`检查: ${filename}...`);

    if (fixMDXFile(file)) {
      process.stdout.write(' ✅ 已清理\n');
      fixedCount++;
    } else {
      process.stdout.write(' ⏭️  无需清理\n');
    }
  }

  console.log(`\n✨ 完成！清理了 ${fixedCount} 个文件中的不相关表格`);
}

main().catch(console.error);