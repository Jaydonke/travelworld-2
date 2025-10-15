#!/usr/bin/env node

/**
 * 修复所有MDX文件中的表格格式问题
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
 * 修复MDX中的表格格式
 */
function fixTableFormatting(content) {
  let fixed = content;
  let changesMade = [];

  // 1. 查找所有表格
  const tableRegex = /(\|[^\n]+\|)(\n(?:\|[^\n]+\||\s*\n)*)+/gm;

  fixed = fixed.replace(tableRegex, (match) => {
    const lines = match.split('\n').filter(line => line.trim());
    const fixedLines = [];
    let tableChanged = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // 跳过分隔符行
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        const content = line.replace(/[\s|]/g, '');
        if (/^[\-:]+$/.test(content)) {
          tableChanged = true;
          continue; // 跳过分隔符行
        }
      }

      // 修复缺少开头 | 的行
      if (line && !line.startsWith('|')) {
        // 检查是否包含 | 分隔符
        if (line.includes('|')) {
          line = '| ' + line;
          tableChanged = true;
        }
      }

      // 修复缺少结尾 | 的行
      if (line && line.startsWith('|') && !line.endsWith('|')) {
        line = line + ' |';
        tableChanged = true;
      }

      // 清理多余的尾部 ||
      if (line.endsWith('||')) {
        line = line.slice(0, -1);
        tableChanged = true;
      }

      // 清理行尾的 | |
      if (line.endsWith('| |')) {
        line = line.slice(0, -3).trim() + ' |';
        tableChanged = true;
      }

      // 修复 |text 格式为 | text
      line = line.replace(/\|([A-Za-z0-9])/g, '| $1');

      if (line.trim()) {
        fixedLines.push(line);
      }
    }

    if (tableChanged) {
      changesMade.push('Fixed table formatting');
    }

    return fixedLines.join('\n') + '\n';
  });

  // 2. 确保表格与其他内容之间有空行
  // 表格后直接跟文本
  fixed = fixed.replace(/(\|[^|\n]+\|[^|\n]*\|)\n([A-Z])/gm, '$1\n\n$2');

  // 表格后直接跟标题
  fixed = fixed.replace(/(\|[^|\n]+\|[^|\n]*\|)\n(#{1,6}\s)/gm, '$1\n\n$2');

  // 3. 修复特定的格式问题
  // 修复 "Clich Question" 应该是 "Cliché Question"
  fixed = fixed.replace(/\bClich\s+Question\b/g, 'Cliché Question');

  return { content: fixed, changes: changesMade };
}

/**
 * 处理单个MDX文件
 */
function processMDXFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: fixed, changes } = fixTableFormatting(content);

    if (changes.length > 0 || content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      const relativePath = path.relative(BLOG_DIR, filePath);
      log(`✅ Fixed ${relativePath}`, 'green');
      if (changes.length > 0) {
        changes.forEach(change => {
          log(`   - ${change}`, 'cyan');
        });
      }
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
  log('     MDX Table Format Fixer', 'bright');
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
  log('         Fixing Complete', 'bright');
  log('====================================\n', 'bright');

  log(`📊 Summary:`, 'cyan');
  log(`   Total files: ${mdxFiles.length}`, 'white');
  log(`   Files fixed: ${fixedCount}`, 'green');
  log(`   Files unchanged: ${mdxFiles.length - fixedCount - errorCount}`, 'yellow');
  if (errorCount > 0) {
    log(`   Errors: ${errorCount}`, 'red');
  }

  log('\n✨ Table formatting fix complete!', 'green');
}

// 运行主函数
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});