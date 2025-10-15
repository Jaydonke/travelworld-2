/**
 * 全面的表格修复函数
 * 可以处理各种损坏的表格格式
 * @param {string} content - 需要修复的内容
 * @returns {string} - 修复后的内容
 */
export function fixMarkdownTables(content) {
  if (!content) return content;

  // 1. 移除表格行末尾的 |** 标记
  content = content.replace(/\|\s*\*\*$/gm, '|');

  // 2. 移除独立的 |** 行
  content = content.replace(/^\s*\|\*\*\s*$/gm, '');

  // 3. 修复表格行之间的空行
  // 匹配整个表格块（包含可能的空行）
  content = content.replace(/(^\|[^\n]*\|$(?:\n(?:^\s*$)?\n?^\|[^\n]*\|$)*)/gm, (tableBlock) => {
    // 分割成行，过滤空行
    const lines = tableBlock.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) return tableBlock;

    // 检查是否真的是表格
    const isTable = lines.every(line => line.includes('|'));
    if (!isTable) return tableBlock;

    // 识别表格的组成部分
    const result = [];
    let headerFound = false;
    let separatorFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isSeparator = /^\|\s*(:?-+:?\s*\|)+\s*(:?-+:?\s*)?(\|)?$/.test(line);

      if (i === 0 && !isSeparator) {
        // 第一行是表头
        result.push(line);
        headerFound = true;
      } else if (headerFound && !separatorFound && isSeparator) {
        // 第二行应该是分隔符
        result.push(line);
        separatorFound = true;
      } else if (!isSeparator && separatorFound) {
        // 数据行
        result.push(line);
      } else if (i === 0 && isSeparator) {
        // 如果第一行就是分隔符，可能是错误格式，跳过
        continue;
      } else if (!headerFound && !isSeparator) {
        // 如果还没有找到表头，这可能是表头
        result.push(line);
        headerFound = true;
      }
    }

    // 确保至少有表头和分隔符
    if (result.length >= 2) {
      return result.join('\n');
    }

    return tableBlock;
  });

  // 4. 修复多余的空列（移除空列）
  content = content.replace(/^(\|[^|\n]*)\|\s*\|([^|\n]*\|.*)$/gm, '$1|$2');

  // 5. 确保表格列数一致
  // 查找表格并修复列数不一致的问题
  const tableRegex = /(^\|[^\n]+\|$\n)(^\|[\s:-]+\|$\n)((?:^\|[^\n]+\|$\n?)*)/gm;
  content = content.replace(tableRegex, (match, header, separator, body) => {
    // 计算表头的列数
    const headerCols = header.split('|').filter(col => col !== '').length;
    const separatorCols = separator.split('|').filter(col => col !== '').length;

    // 如果分隔符列数不匹配，修复它
    if (separatorCols !== headerCols) {
      const separatorParts = [];
      for (let i = 0; i < headerCols; i++) {
        separatorParts.push(' --- ');
      }
      separator = '|' + separatorParts.join('|') + '|\n';
    }

    // 修复数据行的列数
    const bodyLines = body.split('\n').filter(line => line.trim());
    const fixedBodyLines = bodyLines.map(line => {
      const cols = line.split('|').filter((col, index, arr) =>
        !(index === 0 && col === '') && !(index === arr.length - 1 && col === '')
      );

      // 如果列数不匹配，填充或截断
      while (cols.length < headerCols) {
        cols.push(' ');
      }
      if (cols.length > headerCols) {
        cols.length = headerCols;
      }

      return '|' + cols.join('|') + '|';
    });

    return header + separator + fixedBodyLines.join('\n') + (body.endsWith('\n') ? '\n' : '');
  });

  // 6. 清理连续的多个空行（保留最多两个）
  content = content.replace(/\n{3,}/g, '\n\n');

  // 7. 确保表格后有适当的空行
  content = content.replace(/(\|[^\n]+\|\n)([^\n\|])/g, '$1\n$2');

  // 8. 修复破损的粗体标记在表格中
  content = content.replace(/\|\s*\*\*([^|]+)\*\*\s*\|/g, '| **$1** |');

  // 9. 清理表格单元格中的多余空格
  content = content.replace(/\|\s{2,}([^|]+?)\s{2,}\|/g, '| $1 |');

  return content;
}

// 如果直接运行此脚本，则处理所有MDX文件
if (import.meta.url === `file://${process.argv[1]}`) {
  import('fs/promises').then(async ({ default: fs }) => {
    const path = await import('path');

    async function getAllMdxFiles(dir) {
      const files = [];
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.default.join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...await getAllMdxFiles(fullPath));
        } else if (item.name === 'index.mdx') {
          files.push(fullPath);
        }
      }

      return files;
    }

    console.log('🔧 开始全面修复表格...');

    const blogDir = path.default.join(process.cwd(), 'src/content/blog');
    const mdxFiles = await getAllMdxFiles(blogDir);
    let totalFixed = 0;

    for (const filePath of mdxFiles) {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const fixedContent = fixMarkdownTables(originalContent);

      if (fixedContent !== originalContent) {
        await fs.writeFile(filePath, fixedContent, 'utf-8');
        const articleName = path.default.basename(path.default.dirname(filePath));
        console.log(`✅ 修复: ${articleName}`);
        totalFixed++;
      }
    }

    console.log(`\n✨ 完成！共修复了 ${totalFixed} 个文件中的表格。`);
  });
}