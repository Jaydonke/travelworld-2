#!/usr/bin/env node

/**
 * 恢复文章外链脚本
 * 从原始HTML文件中提取外链并重新添加到MDX文件中
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/articles'),
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractExternalLinksFromHTML(htmlContent) {
  // 提取所有外部链接 (http/https开头的)
  const linkRegex = /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  const matches = [...htmlContent.matchAll(linkRegex)];
  
  return matches.map(match => ({
    url: match[1],
    text: match[2].trim(),
    originalHtml: match[0]
  }));
}

function extractTitleFromHTML(htmlContent) {
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

async function restoreLinksForArticle(htmlFilePath) {
  try {
    console.log(`\n📖 处理文件: ${path.basename(htmlFilePath)}`);
    
    // 读取HTML文件
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    const title = extractTitleFromHTML(htmlContent);
    
    if (!title) {
      console.log('❌ 无法提取标题');
      return;
    }
    
    const slug = slugify(title);
    const mdxPath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    
    if (!fs.existsSync(mdxPath)) {
      console.log(`⏭️  跳过：MDX文件不存在 ${slug}`);
      return;
    }
    
    // 提取HTML中的外部链接
    const externalLinks = extractExternalLinksFromHTML(htmlContent);
    
    if (externalLinks.length === 0) {
      console.log('ℹ️  没有找到外部链接');
      return;
    }
    
    console.log(`🔗 找到 ${externalLinks.length} 个外部链接:`);
    externalLinks.forEach(link => {
      console.log(`   "${link.text}" → ${link.url}`);
    });
    
    // 读取MDX内容
    let mdxContent = fs.readFileSync(mdxPath, 'utf8');
    let modified = false;
    
    // 为每个外部链接找到对应的文本并恢复链接
    externalLinks.forEach(link => {
      const escapedText = link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 查找纯文本（不在链接中的）
      const regex = new RegExp(`(?<!\\[)\\b${escapedText}\\b(?!\\]\\([^)]*\\))`, 'gi');
      
      if (regex.test(mdxContent)) {
        // 替换第一个匹配的纯文本为链接
        mdxContent = mdxContent.replace(regex, `[${link.text}](${link.url})`);
        modified = true;
        console.log(`✅ 恢复链接: "${link.text}"`);
      }
    });
    
    if (modified) {
      // 创建备份
      const backupPath = `${mdxPath}.backup.${Date.now()}`;
      fs.copyFileSync(mdxPath, backupPath);
      
      // 写入修改后的内容
      fs.writeFileSync(mdxPath, mdxContent);
      console.log(`💾 已更新文章并创建备份: ${path.basename(backupPath)}`);
    } else {
      console.log('ℹ️  没有需要恢复的链接');
    }
    
  } catch (error) {
    console.error(`❌ 处理失败: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 外链恢复脚本启动');
  console.log(`📂 HTML文件目录: ${CONFIG.newArticlesDir}`);
  console.log(`📂 MDX文件目录: ${CONFIG.articlesDir}`);
  
  if (!fs.existsSync(CONFIG.newArticlesDir)) {
    console.error(`❌ HTML文件目录不存在: ${CONFIG.newArticlesDir}`);
    return;
  }
  
  const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
    .filter(file => file.toLowerCase().endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    console.log('📭 没有找到HTML文件');
    return;
  }
  
  console.log(`📄 找到 ${htmlFiles.length} 个HTML文件`);
  
  for (const htmlFile of htmlFiles) {
    const htmlFilePath = path.join(CONFIG.newArticlesDir, htmlFile);
    await restoreLinksForArticle(htmlFilePath);
  }
  
  console.log('\n🎉 外链恢复完成！');
}

main().catch(console.error);