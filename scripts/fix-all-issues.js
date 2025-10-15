#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fixMdxCodeBlocks(content) {
  let fixedContent = content;

  // 修复重复的代码块标记
  fixedContent = fixedContent.replace(/```css\s*```css/g, '```css');
  fixedContent = fixedContent.replace(/```html\s*```html/g, '```html');
  fixedContent = fixedContent.replace(/```\s*```/g, '```');

  // 修复未闭合的HTML标签 (e.g., *<picture>*)
  fixedContent = fixedContent.replace(/\*<([^>]+)>\*/g, '<$1>');

  // 修复CSS代码块 - 查找没有反引号包围的CSS代码
  const cssPattern = /(?:^|\n)(@media[^{]*\{[\s\S]*?\n\s*\})(?:\n|$)/g;
  fixedContent = fixedContent.replace(cssPattern, (match, cssCode) => {
    if (!match.includes('```')) {
      return `\n\`\`\`css\n${cssCode.trim()}\n\`\`\`\n`;
    }
    return match;
  });

  // 修复HTML代码块 - 查找没有反引号包围的HTML代码
  const htmlPattern = /(?:^|\n)(<[^>]*>[\s\S]*?<\/[^>]*>)(?:\n|$)/g;
  fixedContent = fixedContent.replace(htmlPattern, (match, htmlCode) => {
    if (!match.includes('```')) {
      return `\n\`\`\`html\n${htmlCode.trim()}\n\`\`\`\n`;
    }
    return match;
  });

  // 修复独立的CSS规则
  const cssRulePattern = /(?:^|\n)(\.[a-zA-Z-]+\s*\{[\s\S]*?\n\s*\})(?:\n|$)/g;
  fixedContent = fixedContent.replace(cssRulePattern, (match, cssRule) => {
    if (!match.includes('```')) {
      return `\n\`\`\`css\n${cssRule.trim()}\n\`\`\`\n`;
    }
    return match;
  });

  return fixedContent;
}

function ensureCoverField(content, title) {
  // 找到 frontmatter 的结束 ---
  const frontmatterEnd = content.indexOf('---', 3);
  if (frontmatterEnd === -1) return content;
  
  const frontmatter = content.slice(0, frontmatterEnd);
  // 已有 cover 字段则直接返回
  if (/^cover:/m.test(frontmatter)) return content;
  
  // 构造 cover 字段
  const slug = slugify(title);
  const coverLine = `cover: '../../assets/images/articles/${slug}/cover.png'\n`;
  
  // 找到最后一个字段的位置，在其后插入 cover 字段
  const lines = frontmatter.split('\n');
  let insertIndex = lines.length - 1;
  
  // 从后往前找到最后一个非空字段
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() && !lines[i].startsWith('---')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  // 插入 cover 字段
  lines.splice(insertIndex, 0, coverLine);
  
  // 重新组合内容
  const newFrontmatter = lines.join('\n');
  return newFrontmatter + content.slice(frontmatterEnd);
}

function createDefaultCoverImage(targetPath) {
  // 使用一个简单的1x1像素的PNG图片（base64编码）
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

function processArticle(articleDir) {
  try {
    const mdxPath = path.join(articleDir, 'index.mdx');
    if (!fs.existsSync(mdxPath)) {
      return { codeblocksFixed: false, coverFixed: false };
    }

    const content = fs.readFileSync(mdxPath, 'utf8');
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    if (!titleMatch) {
      return { codeblocksFixed: false, coverFixed: false };
    }

    const title = titleMatch[1];
    let updatedContent = content;
    let codeblocksFixed = false;
    let coverFixed = false;

    // 1. 修复代码块格式
    const fixedContent = fixMdxCodeBlocks(content);
    if (content !== fixedContent) {
      updatedContent = fixedContent;
      codeblocksFixed = true;
    }

    // 2. 强制修正/插入cover字段
    const beforeCover = updatedContent;
    updatedContent = ensureCoverField(updatedContent, title);
    if (beforeCover !== updatedContent) {
      coverFixed = true;
    }

    // 3. 修复封面图片路径（.avif->.png）
    if (updatedContent.includes('.avif')) {
      updatedContent = updatedContent.replace(/\.avif'/g, ".png'");
      coverFixed = true;
    }

    // 4. 创建封面图片文件
    const articleSlug = slugify(title);
    const articleImagesDir = path.join(imagesDir, articleSlug);
    const coverImagePath = path.join(articleImagesDir, 'cover.png');

    if (!fs.existsSync(articleImagesDir)) {
      fs.mkdirSync(articleImagesDir, { recursive: true });
    }

    if (!fs.existsSync(coverImagePath)) {
      createDefaultCoverImage(coverImagePath);
      coverFixed = true;
    }

    // 保存更新后的内容
    if (content !== updatedContent) {
      fs.writeFileSync(mdxPath, updatedContent);
    }

    return { codeblocksFixed, coverFixed };
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(articleDir)} - ${error.message}`);
    return { codeblocksFixed: false, coverFixed: false };
  }
}

function main() {
  console.log('🔧 综合问题修复脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let totalCount = 0;
  let codeblocksFixedCount = 0;
  let coverFixedCount = 0;

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalCount++;
      console.log(`\n🔧 处理文章: ${item}`);

      const result = processArticle(fullPath);

      if (result.codeblocksFixed) {
        console.log(`  ✅ 代码块格式已修复`);
        codeblocksFixedCount++;
      }

      if (result.coverFixed) {
        console.log(`  ✅ 封面图片已修复`);
        coverFixedCount++;
      }

      if (!result.codeblocksFixed && !result.coverFixed) {
        console.log(`  📋 无需修复`);
      }
    }
  }

  console.log('\n📊 修复结果摘要:');
  console.log(`📁 总文章数: ${totalCount}`);
  console.log(`🔧 代码块修复: ${codeblocksFixedCount}`);
  console.log(`🖼️  封面图片修复: ${coverFixedCount}`);

  console.log('\n🎉 所有问题修复完成！');
  console.log('💡 提示: 现在可以正常运行 "npm run dev"');
}

main(); 