#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

function testArticleStructure(articleDir) {
  try {
    const mdxPath = path.join(articleDir, 'index.mdx');
    if (!fs.existsSync(mdxPath)) {
      return { valid: false, error: 'MDX文件不存在' };
    }

    const content = fs.readFileSync(mdxPath, 'utf8');

    // 检查必要的frontmatter字段
    const requiredFields = [
      'isDraft',
      'isMainHeadline',
      'isSubHeadline',
      'description',
      'title',
      'category',
      'publishedTime',
      'authors',
      'cover'
    ];

    const missingFields = [];
    for (const field of requiredFields) {
      if (!content.includes(`${field}:`)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return { valid: false, error: `缺少字段: ${missingFields.join(', ')}` };
    }

    // 检查封面图片文件是否存在
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    if (titleMatch) {
      const title = titleMatch[1];
      const articleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const coverImagePath = path.join(imagesDir, articleSlug, 'cover.png');

      if (!fs.existsSync(coverImagePath)) {
        return { valid: false, error: '封面图片文件不存在' };
      }
    }

    // 检查MDX语法错误
    if (content.includes('```css```css') || content.includes('```html```html')) {
      return { valid: false, error: '代码块格式错误' };
    }

    if (content.includes('*<') && content.includes('>*')) {
      return { valid: false, error: 'HTML标签格式错误' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function main() {
  console.log('🧪 完整工作流程测试启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  console.log(`📂 图片目录: ${imagesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  let totalCount = 0;
  let validCount = 0;
  let invalidCount = 0;
  const invalidArticles = [];

  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      totalCount++;
      console.log(`\n🔍 测试文章: ${item}`);

      const result = testArticleStructure(fullPath);

      if (result.valid) {
        console.log(`  ✅ 验证通过`);
        validCount++;
      } else {
        console.log(`  ❌ 验证失败: ${result.error}`);
        invalidCount++;
        invalidArticles.push({ name: item, error: result.error });
      }
    }
  }

  console.log('\n📊 测试结果摘要:');
  console.log(`📁 总文章数: ${totalCount}`);
  console.log(`✅ 验证通过: ${validCount}`);
  console.log(`❌ 验证失败: ${invalidCount}`);

  if (invalidArticles.length > 0) {
    console.log('\n❌ 验证失败的文章:');
    invalidArticles.forEach(article => {
      console.log(`  - ${article.name}: ${article.error}`);
    });
  }

  if (invalidCount === 0) {
    console.log('\n🎉 所有文章验证通过！工作流程完全正常！');
    console.log('💡 提示: 可以安全地运行 "npm run dev" 启动网站');
  } else {
    console.log('\n⚠️  发现验证失败的文章，请运行 "npm run fix-all" 修复问题');
  }
}

main().catch(console.error); 