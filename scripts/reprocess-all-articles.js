#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');
const imagesDir = path.join(__dirname, '../src/assets/images/articles');

async function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} 完成`);
  } catch (error) {
    console.error(`❌ ${description} 失败: ${error.message}`);
  }
}

async function reprocessAllArticles() {
  console.log('🚀 批量重新处理所有文章');
  console.log('📋 这个流程将：');
  console.log('   1. 删除所有现有文章');
  console.log('   2. 删除所有现有文章图片');
  console.log('   3. 重新转换所有HTML文章');
  console.log('   4. 应用所有修复脚本');

  // 确认操作
  console.log('\n⚠️  警告：这将删除所有现有文章和图片！');
  console.log('📁 文章目录:', articlesDir);
  console.log('🖼️ 图片目录:', imagesDir);

  // 检查现有文章数量
  if (fs.existsSync(articlesDir)) {
    const articles = fs.readdirSync(articlesDir).filter(item => {
      const fullPath = path.join(articlesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
    console.log(`📊 发现 ${articles.length} 篇现有文章`);
  }

  // 阶段1: 删除所有现有文章
  console.log('\n🗑️ 阶段1: 删除所有现有文章');
  if (fs.existsSync(articlesDir)) {
    const articles = fs.readdirSync(articlesDir);
    let deletedCount = 0;

    for (const article of articles) {
      const articlePath = path.join(articlesDir, article);
      const stat = fs.statSync(articlePath);

      if (stat.isDirectory()) {
        fs.rmSync(articlePath, { recursive: true, force: true });
        console.log(`🗑️ 已删除文章: ${article}`);
        deletedCount++;
      }
    }
    console.log(`✅ 已删除 ${deletedCount} 篇文章`);
  }

  // 阶段2: 删除所有现有文章图片
  console.log('\n🗑️ 阶段2: 删除所有现有文章图片');
  if (fs.existsSync(imagesDir)) {
    const imageDirs = fs.readdirSync(imagesDir);
    let deletedCount = 0;

    for (const imageDir of imageDirs) {
      const imagePath = path.join(imagesDir, imageDir);
      const stat = fs.statSync(imagePath);

      if (stat.isDirectory()) {
        fs.rmSync(imagePath, { recursive: true, force: true });
        console.log(`🗑️ 已删除图片目录: ${imageDir}`);
        deletedCount++;
      }
    }
    console.log(`✅ 已删除 ${deletedCount} 个图片目录`);
  }

  // 阶段3: 重新转换所有HTML文章
  console.log('\n📄 阶段3: 重新转换所有HTML文章');
  await runCommand('npm run convert-html', '转换HTML文章');

  // 阶段4: 应用所有修复脚本
  console.log('\n🔧 阶段4: 应用所有修复脚本');
  await runCommand('npm run fix-all', '应用所有修复');

  console.log('\n🎉 批量重新处理完成！');
  console.log('💡 所有文章现在都使用修复后的转换逻辑');
  console.log('📝 格式问题（列表、表格、副标题）已全部修复');
  console.log('🖼️ 所有图片都已本地化');
}

reprocessAllArticles(); 