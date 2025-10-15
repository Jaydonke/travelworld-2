/**
 * 修复Markdown格式问题，包括粗体标记和文本格式
 */
import fs from 'fs/promises';
import path from 'path';

/**
 * 综合修复Markdown格式问题
 */
function fixMarkdownFormatting(content) {
  if (!content) return content;

  // 1. 修复粗体标记问题
  // 修复结尾有多余星号的情况 (****变成**)
  content = content.replace(/\*{3,}/g, '**');

  // 修复 **文本** ** 这种格式（中间有空格的双星号）
  content = content.replace(/(\*\*[^*]+\*\*)\s+\*\*/g, '$1\n');

  // 修复 ** **文本** 这种格式（开头有孤立的**）
  content = content.replace(/\*\*\s+\*\*([^*]+)\*\*/g, '**$1**');

  // 修复单独的 ** 在行尾
  content = content.replace(/([^*])\s*\*\*$/gm, '$1');

  // 修复文本中间突然出现的孤立 **
  content = content.replace(/([a-zA-Z0-9,.:;!?])\s*\*\*\s+([A-Z])/g, '$1\n\n$2');

  // 2. 修复文本连接问题
  // 修复类似 "iconicIndiana Jonesseries" 的问题
  content = content.replace(/([a-z])([A-Z][a-z])/g, (match, p1, p2) => {
    // 检查是否是正常的驼峰命名（如JavaScript）
    if (/^[a-z]+[A-Z][a-z]+/.test(match)) {
      return match; // 保持不变
    }
    // 否则添加空格
    return p1 + ' ' + p2;
  });

  // 3. 修复列表格式问题
  // 修复 **文本:** ** 这种格式
  content = content.replace(/(\*\*[^:]+:\*\*)\s*\*\*/g, '$1\n');

  // 4. 修复标题后直接跟粗体文本的问题
  content = content.replace(/(#{1,6}\s+[^\n]+)\*\*([^\n]+)\*\*/g, '$1\n\n**$2**');

  // 5. 清理多余的空行（保留最多两个）
  content = content.replace(/\n{4,}/g, '\n\n\n');

  // 6. 修复粗体文本后直接跟普通文本的问题
  // 例如: **Title**Some text -> **Title**\nSome text
  content = content.replace(/(\*\*[^*]+\*\*)([A-Z][a-z])/g, '$1\n\n$2');

  // 7. 修复列表项中的格式问题
  content = content.replace(/^(\s*[-*+]\s+)(.+?)\*\*\s*\*\*/gm, '$1$2');

  // 8. 修复段落中间的孤立星号
  content = content.replace(/([^*\s])\s+\*\*\s+([^*])/g, '$1 $2');

  // 9. 特别处理电影标题格式
  // 修复类似 "**Spider-Man: Beyond the Spider-Verse** **" 的格式
  content = content.replace(/(\*\*[^*]+:\s*[^*]+\*\*)\s*\*\*/g, '$1');

  // 10. 修复不完整的粗体（只有开头或结尾）
  // 移除行首的孤立 **
  content = content.replace(/^\s*\*\*\s+([A-Z])/gm, '$1');

  // 移除行尾的孤立 **
  content = content.replace(/([.!?])\s*\*\*\s*$/gm, '$1');

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
  console.log('🔧 开始修复Markdown格式问题...\n');

  const blogDir = path.join(process.cwd(), 'src/content/blog');
  const mdxFiles = await getAllMdxFiles(blogDir);
  let totalFixed = 0;
  let totalChecked = 0;

  for (const filePath of mdxFiles) {
    totalChecked++;
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const fixedContent = fixMarkdownFormatting(originalContent);

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