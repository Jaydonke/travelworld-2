#!/usr/bin/env node

/**
 * 清理MDX文件中的格式错误
 * - 移除所有的 ** 粗体标记
 * - 移除表格中的 --- 分隔符行
 * - 清理其他格式问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 清理MDX内容中的格式问题
 */
function cleanMDXContent(content, filePath) {
  let cleaned = content;
  let changesMade = [];

  // 1. 移除所有的 ** 粗体标记
  if (cleaned.includes('**')) {
    cleaned = cleaned.replace(/\*\*/g, '');
    changesMade.push('Removed ** bold markers');
  }

  // 2. 移除单个的 * 斜体标记（但保留列表项的 * ）
  // 只移除不在行首的 * （列表项的 * 在行首）
  const oldContent = cleaned;
  cleaned = cleaned.replace(/([^\n\s])\*([^\s*])/g, '$1$2'); // 移除单词中间的*
  cleaned = cleaned.replace(/([^\n\s])\*\s/g, '$1 '); // 移除单词后的*
  cleaned = cleaned.replace(/\s\*([^\s*])/g, ' $1'); // 移除单词前的*
  if (cleaned !== oldContent) {
    changesMade.push('Removed * italic markers');
  }

  // 3. 修复表格格式 - 移除分隔符行
  // 匹配表格并移除其中的 --- 行
  const tablePattern = /(\|[^\n]+\|\n)((?:\|[\s\-:]+\|\n)+)((?:\|[^\n]+\|\n)*)/gm;
  const oldTables = cleaned.match(tablePattern);

  cleaned = cleaned.replace(tablePattern, (match, header, separators, body) => {
    // 只保留头部和数据行，移除所有分隔符行
    const cleanedSeparators = separators.split('\n')
      .filter(line => !line.match(/^\s*\|[\s\-:]+\|\s*$/))
      .join('\n');

    if (cleanedSeparators) {
      // 如果还有非分隔符行，保留它们
      return header + cleanedSeparators + (cleanedSeparators ? '\n' : '') + body;
    } else {
      // 否则直接连接header和body
      return header + body;
    }
  });

  if (oldTables && cleaned.match(tablePattern)?.toString() !== oldTables.toString()) {
    changesMade.push('Fixed table separator rows');
  }

  // 4. 专门处理 | --- | --- | 格式的行（包括多个---的情况）
  const oldSeparatorCount = (cleaned.match(/^\s*\|[\s\-:]+\|/gm) || []).length;
  // 移除只包含 ---, 空格, | 和 : 的行
  cleaned = cleaned.replace(/^\s*\|[\s\-:|]+\|\s*$/gm, (match) => {
    // 检查是否真的是分隔符行（只包含 -, 空格, : 和 |）
    const content = match.replace(/[\s|]/g, '');
    if (/^[\-:]+$/.test(content)) {
      return ''; // 删除分隔符行
    }
    return match; // 保留其他行
  });
  const newSeparatorCount = (cleaned.match(/^\s*\|[\s\-]+\|/gm) || []).length;
  if (oldSeparatorCount > newSeparatorCount) {
    changesMade.push(`Removed ${oldSeparatorCount - newSeparatorCount} table separator lines`);
  }

  // 5. 清理连续的空行（超过2个空行改为2个）
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

  // 6. 清理行尾的空格
  cleaned = cleaned.replace(/[ \t]+$/gm, '');

  // 7. 确保文件末尾有换行
  if (!cleaned.endsWith('\n')) {
    cleaned += '\n';
  }

  // 8. 修复特定的格式问题
  // 修复类似 "audience.\n\n**\nUnderstanding" 的问题
  cleaned = cleaned.replace(/\.\s*\n+\*\*\s*\n+/g, '.\n\n');

  // 修复孤立的 **
  cleaned = cleaned.replace(/^\s*\*\*\s*$/gm, '');

  // 9. 修复表格中的错误格式如 "| Clich Question |" 应该是 "| Cliché Question |"
  cleaned = cleaned.replace(/\bClich\s+Question\b/g, 'Cliché Question');

  // 10. 修复表格头部格式
  cleaned = cleaned.replace(/\|\s*\*\*([^*|]+)\*\*\s*\|/g, '| $1 |');

  // 10.5 修复表格单元格缺少空格的问题
  // 修复 |text 为 | text
  cleaned = cleaned.replace(/\|([A-Za-z])/g, '| $1');

  // 11. 修复表格行后紧跟文本的问题（在表格最后一行后添加空行）
  // 匹配表格行后直接跟着文本的情况
  cleaned = cleaned.replace(/(\|[^|\n]+\|[^|\n]+\|[^|\n]*\|)([A-Z][^|\n])/gm, '$1\n\n$2');

  // 修复表格行后直接跟着 ## 标题的情况
  cleaned = cleaned.replace(/(\|[^|\n]+\|[^|\n]+\|[^|\n]*\|)(##)/gm, '$1\n\n$2');

  // 12. 修复分离的表格行（多行合并为单行）
  // 简化的修复方法：查找没有开头 | 的表格行
  let tableFixed = false;

  // 修复缺少开头 | 的表格行
  // 例如: Engagement Level | High - viewers | Moderate - passive |
  // 应该是: | Engagement Level | High - viewers | Moderate - passive |
  const lines = cleaned.split('\n');
  const fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 检查是否是缺少开头 | 的表格行
    if (line.includes('|') && !line.trim().startsWith('|') && !line.trim().startsWith('#') && !line.trim().startsWith('-') && !line.trim().startsWith('*')) {
      // 计算 | 的数量
      const pipeCount = (line.match(/\|/g) || []).length;

      // 如果有至少2个 |，可能是表格行
      if (pipeCount >= 2) {
        // 检查前面几行是否有表格头（可能有空行）
        let hasTableHeader = false;
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          if (lines[j].trim().startsWith('|') && lines[j].includes('|')) {
            hasTableHeader = true;
            break;
          }
        }

        if (hasTableHeader) {
          // 清理多余的尾部 | 和空格
          line = line.trim();
          // 移除尾部多余的 |
          if (line.endsWith('| |')) {
            line = line.slice(0, -3).trim();
          } else if (line.endsWith('|')) {
            line = line.slice(0, -1).trim();
          }

          fixedLines.push('| ' + line);
          tableFixed = true;
        } else {
          fixedLines.push(line);
        }
      } else {
        fixedLines.push(line);
      }
    } else if (line.trim() === '|') {
      // 移除只有单个 | 的行
      tableFixed = true;
      // 跳过这一行
    } else {
      fixedLines.push(line);
    }
  }

  if (tableFixed) {
    cleaned = fixedLines.join('\n');
    changesMade.push('Fixed broken table rows');
  }

  return { content: cleaned, changes: changesMade };
}

/**
 * 处理单个MDX文件
 */
function processMDXFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: cleaned, changes } = cleanMDXContent(content, filePath);

    if (changes.length > 0) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      const relativePath = path.relative(BLOG_DIR, filePath);
      log(`✅ Fixed ${relativePath}:`, 'green');
      changes.forEach(change => {
        log(`   - ${change}`, 'cyan');
      });
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ Error processing ${filePath}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 递归查找所有MDX文件
 */
function findMDXFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMDXFiles(fullPath));
    } else if (item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 主函数
 */
async function main() {
  log('\n====================================', 'bright');
  log('     MDX Format Cleaner', 'bright');
  log('====================================\n', 'bright');

  // 查找所有MDX文件
  const mdxFiles = findMDXFiles(BLOG_DIR);
  log(`Found ${mdxFiles.length} MDX files to process\n`, 'blue');

  let fixedCount = 0;
  let errorCount = 0;

  // 处理每个文件
  for (const file of mdxFiles) {
    const result = processMDXFile(file);
    if (result === true) {
      fixedCount++;
    } else if (result === false) {
      // No changes needed
    } else {
      errorCount++;
    }
  }

  // 输出总结
  log('\n====================================', 'bright');
  log('         Cleaning Complete', 'bright');
  log('====================================\n', 'bright');

  log(`📊 Summary:`, 'cyan');
  log(`   Total files: ${mdxFiles.length}`, 'white');
  log(`   Files fixed: ${fixedCount}`, 'green');
  log(`   Files unchanged: ${mdxFiles.length - fixedCount - errorCount}`, 'yellow');
  if (errorCount > 0) {
    log(`   Errors: ${errorCount}`, 'red');
  }

  log('\n✨ Formatting cleanup complete!', 'green');
  log('\n📝 Next steps:', 'cyan');
  log('   1. Review the changes', 'white');
  log('   2. Run: npm run dev (to preview)', 'white');
  log('   3. Commit the changes if satisfied', 'white');
}

// 运行主函数
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});