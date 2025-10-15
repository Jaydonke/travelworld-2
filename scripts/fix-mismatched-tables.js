/**
 * 修复表格列数不匹配和内容错误的问题
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * 修复表格列数和格式问题
 */
function fixTableColumnMismatch(content) {
  if (!content) return content;

  // 修复列数不匹配的表格
  // 匹配表格（包括可能损坏的）
  const tablePattern = /(^\|.*\|$\n)(^\|[\s:-]+\|$\n)?((?:^\|.*\|$\n)*)/gm;

  content = content.replace(tablePattern, (match, headerLine, separatorLine, bodyLines) => {
    // 清理表头行，移除空列
    let cleanedHeader = headerLine.trim();

    // 检测并修复有空列的情况（连续的 | |）
    cleanedHeader = cleanedHeader.replace(/\|\s*\|\s*/g, '|');

    // 检测文章标题混入表格的情况
    // 如果发现 "How music influences" 这样的文本混在表格中，说明可能是错误
    if (cleanedHeader.toLowerCase().includes('how music influences')) {
      console.log('发现可疑的表格内容混入，可能需要删除整个表格');
      // 检查表格内容是否与音乐主题不相关
      if (bodyLines && (bodyLines.includes('investors') || bodyLines.includes('Investment'))) {
        console.log('发现不相关的投资内容表格，删除它');
        return ''; // 删除整个不相关的表格
      }
    }

    // 计算清理后的列数
    const headerCols = cleanedHeader.split('|').filter(col => col.trim() !== '').length;

    // 如果没有分隔符行，创建一个
    if (!separatorLine) {
      const separators = Array(headerCols).fill(' --- ');
      separatorLine = '|' + separators.join('|') + '|\n';
    } else {
      // 修复分隔符行的列数
      const sepCols = separatorLine.split('|').filter(col => col.trim() !== '').length;
      if (sepCols !== headerCols) {
        const separators = Array(headerCols).fill(' --- ');
        separatorLine = '|' + separators.join('|') + '|\n';
      }
    }

    // 修复数据行
    let fixedBody = '';
    if (bodyLines) {
      const lines = bodyLines.split('\n').filter(line => line.trim());
      fixedBody = lines.map(line => {
        // 清理空列
        let cleanedLine = line.replace(/\|\s*\|\s*/g, '|');
        const cols = cleanedLine.split('|').filter((col, idx, arr) =>
          !(idx === 0 && col === '') && !(idx === arr.length - 1 && col === '')
        );

        // 确保列数匹配
        while (cols.length < headerCols) {
          cols.push(' ');
        }
        if (cols.length > headerCols) {
          cols.length = headerCols;
        }

        return '|' + cols.join('|') + '|';
      }).join('\n');

      if (fixedBody) {
        fixedBody += '\n';
      }
    }

    return cleanedHeader + '\n' + separatorLine + fixedBody;
  });

  // 确保表格后面有适当的空行，特别是在标题之前
  content = content.replace(/(\|[^\n]+\|)\n(#{1,6}\s)/gm, '$1\n\n$2');

  // 移除表格行末尾的 |**
  content = content.replace(/\|\s*\*\*$/gm, '|');

  // 移除独立的 |** 行
  content = content.replace(/^\s*\|\*\*\s*$/gm, '');

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
  console.log('🔧 开始修复表格列数不匹配问题...\n');

  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const mdxFiles = await getAllMdxFiles(blogDir);
  let totalFixed = 0;
  let totalChecked = 0;

  for (const filePath of mdxFiles) {
    totalChecked++;
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const fixedContent = fixTableColumnMismatch(originalContent);

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