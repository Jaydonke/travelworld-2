/**
 * 安全的表格修复函数
 * 只修复明确的问题，不会改变正常的表格
 */
export function safeFixMarkdownTables(content) {
  if (!content) return content;

  let modified = false;
  const originalContent = content;

  // 1. 只移除明确的 |** 标记（这是明确的错误）
  if (content.includes('|**')) {
    content = content.replace(/\|\s*\*\*$/gm, '|');
    content = content.replace(/^\s*\|\*\*\s*$/gm, '');
    modified = true;
  }

  // 2. 只修复表格行之间的空行（保守的方法）
  // 只处理明确是表格且有空行的情况
  const tableWithGapsPattern = /(^\|[^\n]+\|$)\n\n+(^\|[^\n]+\|$)/gm;
  if (tableWithGapsPattern.test(content)) {
    content = content.replace(tableWithGapsPattern, '$1\n$2');
    modified = true;
  }

  // 3. 只修复明确的空列问题（连续的 || 且中间为空）
  const emptyColumnPattern = /\|\s*\|\s*\|/g;
  if (emptyColumnPattern.test(content)) {
    content = content.replace(/\|(\s*)\|\s*\|/g, '|$1|');
    modified = true;
  }

  // 如果没有修改，返回原始内容
  if (!modified) {
    return originalContent;
  }

  return content;
}

// 测试函数
function testSafeFix() {
  // 测试1: 正常表格不应被改变
  const normalTable = `| Header1 | Header2 | Header3 |
| --- | --- | --- |
| Data1 | Data2 | Data3 |
| Data4 | Data5 | Data6 |`;

  const fixed1 = safeFixMarkdownTables(normalTable);
  console.log('测试1 - 正常表格:', fixed1 === normalTable ? '✅ 未改变' : '❌ 被修改了');

  // 测试2: 损坏的表格应该被修复
  const brokenTable = `| Header1 | Header2 | Header3 |**
| --- | --- | --- |

| Data1 | Data2 | Data3 |**

| Data4 | Data5 | Data6 |**`;

  const fixed2 = safeFixMarkdownTables(brokenTable);
  console.log('测试2 - 损坏表格:', !fixed2.includes('|**') ? '✅ 已修复' : '❌ 未修复');

  // 测试3: 故意的多空行不应被过度修复
  const intentionalGaps = `Some text

| Table1 |
| --- |
| Data |


Some other text with intentional gaps`;

  const fixed3 = safeFixMarkdownTables(intentionalGaps);
  console.log('测试3 - 故意的空行:', fixed3.includes('\n\n\n') ? '✅ 保留了' : '❌ 被改了');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('运行安全性测试...\n');
  testSafeFix();

  // 处理文件
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

    console.log('\n🔧 开始安全修复表格...');

    const blogDir = path.default.join(process.cwd(), 'src/content/blog');
    const mdxFiles = await getAllMdxFiles(blogDir);
    let totalFixed = 0;
    let totalChecked = 0;

    for (const filePath of mdxFiles) {
      totalChecked++;
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const fixedContent = safeFixMarkdownTables(originalContent);

      if (fixedContent !== originalContent) {
        // 创建备份
        const backupPath = filePath + '.backup-' + Date.now();
        await fs.writeFile(backupPath, originalContent, 'utf-8');

        await fs.writeFile(filePath, fixedContent, 'utf-8');
        const articleName = path.default.basename(path.default.dirname(filePath));
        console.log(`✅ 修复: ${articleName} (备份已创建)`);
        totalFixed++;
      }
    }

    console.log(`\n✨ 完成！检查了 ${totalChecked} 个文件，修复了 ${totalFixed} 个文件。`);
    if (totalFixed > 0) {
      console.log('💾 所有修改的文件都已创建备份（.backup-[时间戳]）');
    }
  });
}