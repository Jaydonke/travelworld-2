/**
 * 修复表格中重复的分隔符行问题
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * 修复重复的分隔符行和格式问题
 */
function fixDuplicateSeparators(content) {
  if (!content) return content;

  // 1. 移除重复的分隔符行
  // 匹配连续的分隔符行
  content = content.replace(/(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)(^\|\s*(?:-+\s*\|)+\s*-*\s*\|\s*$\n)+/gm, '$1');

  // 2. 修复表格格式，特别处理有重复分隔符的情况
  const tablePattern = /(^\|.*\|$)(\n^\|\s*(?:-+\s*\|)+.*\|$){2,}(\n(?:^\|.*\|$\n?)*)/gm;

  content = content.replace(tablePattern, (match, header, separators, body) => {
    // 只保留一个分隔符行
    const separatorMatch = separators.match(/^\|\s*(?:-+\s*\|)+.*\|$/m);
    const singleSeparator = separatorMatch ? separatorMatch[0] : separators.split('\n')[1];

    return header + '\n' + singleSeparator + body;
  });

  // 3. 修复表头中的格式问题（不匹配的星号）
  content = content.replace(/\*{1,2}([^|*]+)\*{1,2}/g, (match, text) => {
    // 如果在表格行中，移除所有星号
    if (match.includes('|') || /^\|/.test(match)) {
      return text.trim();
    }
    // 否则保持正确的粗体格式
    return `**${text.trim()}**`;
  });

  // 4. 特别修复表格内的格式错误
  content = content.replace(/(\|[^|\n]*)\*{1,2}([^|*\n]+)\*{1,2}([^|\n]*\|)/g, '$1$2$3');

  return content;
}

/**
 * 获取所有MDX文件
 */
async function getAllMdxFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...await getAllMdxFiles(fullPath));
    } else if (item.name === 'index.mdx') {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 主函数
 */
async function main() {
  console.log('🔧 开始修复重复的分隔符行问题...\n');

  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const mdxFiles = await getAllMdxFiles(blogDir);
  let totalFixed = 0;
  let totalChecked = 0;

  for (const filePath of mdxFiles) {
    totalChecked++;
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const fixedContent = fixDuplicateSeparators(originalContent);

    if (fixedContent !== originalContent) {
      await fs.writeFile(filePath, fixedContent, 'utf-8');
      const articleName = path.basename(path.dirname(filePath));
      console.log(`✅ 修复: ${articleName}`);
      totalFixed++;
    }
  }

  console.log(`\n✨ 完成！检查了 ${totalChecked} 个文件，修复了 ${totalFixed} 个文件。`);
}

// 运行脚本
main().catch(console.error);