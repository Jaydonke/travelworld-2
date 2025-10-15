#!/usr/bin/env node

/**
 * 修复文章文件夹同步问题的脚本
 * 
 * 问题：generate-articles.js 使用原始topic生成图片文件夹
 *      而 add-articles-improved.js 使用GPT生成的title生成文件夹
 * 
 * 解决方案：
 * 1. 扫描newarticle中的HTML文件
 * 2. 提取实际的标题
 * 3. 查找对应的图片文件夹
 * 4. 重命名图片文件夹以匹配标题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles')
};

// 统一的 slugify 函数（与 add-articles-improved.js 保持一致）
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// 从HTML中提取标题
function extractTitle(htmlContent) {
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

// 查找相似的文件夹
function findSimilarFolder(targetSlug, existingFolders) {
  // 首先尝试精确匹配
  if (existingFolders.includes(targetSlug)) {
    return targetSlug;
  }

  // 尝试查找包含主要关键词的文件夹
  const keywords = targetSlug.split('-').filter(word => word.length > 3);
  
  for (const folder of existingFolders) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (folder.includes(keyword)) {
        matchCount++;
      }
    }
    // 如果匹配超过60%的关键词，认为是同一个文件夹
    if (matchCount >= keywords.length * 0.6) {
      return folder;
    }
  }
  
  return null;
}

async function fixFolderSync() {
  console.log('🔧 开始修复文章文件夹同步问题...\n');

  // 检查源目录
  if (!fs.existsSync(CONFIG.newArticlesDir)) {
    console.log('❌ newarticle 目录不存在');
    return;
  }

  // 读取所有HTML文件
  const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
    .filter(file => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('❌ 没有找到HTML文件');
    return;
  }

  console.log(`📂 找到 ${htmlFiles.length} 个HTML文件\n`);

  // 获取所有现有的图片文件夹
  const existingImageFolders = fs.existsSync(CONFIG.imagesDir) 
    ? fs.readdirSync(CONFIG.imagesDir).filter(item => {
        const itemPath = path.join(CONFIG.imagesDir, item);
        return fs.statSync(itemPath).isDirectory();
      })
    : [];

  const fixes = [];
  const mappings = {};

  // 处理每个HTML文件
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(CONFIG.newArticlesDir, htmlFile);
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // 提取标题
    const title = extractTitle(htmlContent);
    if (!title) {
      console.log(`⚠️  无法提取标题: ${htmlFile}`);
      continue;
    }

    const targetSlug = slugify(title);
    
    // 从文件名生成的slug（generate-articles.js 的逻辑）
    const fileNameBase = htmlFile.replace('.html', '');
    const fileSlug = slugify(fileNameBase);

    // 查找可能的图片文件夹
    const similarFolder = findSimilarFolder(fileSlug, existingImageFolders) ||
                         findSimilarFolder(targetSlug, existingImageFolders);

    if (similarFolder && similarFolder !== targetSlug) {
      fixes.push({
        htmlFile,
        title,
        oldFolder: similarFolder,
        newFolder: targetSlug
      });
      mappings[htmlFile] = {
        title,
        imageFolder: targetSlug
      };
    } else if (similarFolder === targetSlug) {
      console.log(`✅ ${htmlFile} -> 文件夹已正确命名: ${targetSlug}`);
      mappings[htmlFile] = {
        title,
        imageFolder: targetSlug
      };
    } else {
      console.log(`⚠️  ${htmlFile} -> 未找到对应图片文件夹`);
      console.log(`    标题: ${title}`);
      console.log(`    预期文件夹: ${targetSlug}`);
      mappings[htmlFile] = {
        title,
        imageFolder: targetSlug,
        missing: true
      };
    }
  }

  // 执行修复
  if (fixes.length > 0) {
    console.log(`\n🔧 需要修复 ${fixes.length} 个文件夹:\n`);
    
    for (const fix of fixes) {
      const oldPath = path.join(CONFIG.imagesDir, fix.oldFolder);
      const newPath = path.join(CONFIG.imagesDir, fix.newFolder);
      
      console.log(`📁 重命名文件夹:`);
      console.log(`   文件: ${fix.htmlFile}`);
      console.log(`   标题: ${fix.title}`);
      console.log(`   从: ${fix.oldFolder}`);
      console.log(`   到: ${fix.newFolder}`);
      
      try {
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          console.log(`   ✅ 成功\n`);
        } else {
          console.log(`   ❌ 源文件夹不存在\n`);
        }
      } catch (error) {
        console.log(`   ❌ 错误: ${error.message}\n`);
      }
    }
  } else {
    console.log('\n✅ 所有文件夹都已正确命名，无需修复');
  }

  // 保存映射文件
  const mappingPath = path.join(__dirname, '../article-folder-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mappings, null, 2));
  console.log(`\n💾 映射文件已保存到: article-folder-mapping.json`);

  // 显示统计
  console.log('\n📊 统计信息:');
  console.log(`   总文件数: ${htmlFiles.length}`);
  console.log(`   已修复: ${fixes.length}`);
  console.log(`   正确: ${Object.values(mappings).filter(m => !m.missing && !fixes.find(f => f.newFolder === m.imageFolder)).length}`);
  console.log(`   缺失: ${Object.values(mappings).filter(m => m.missing).length}`);
}

// 运行修复
fixFolderSync().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});