#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

function extractYouTubeVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function convertYouTubeLinks(content) {
  let modifiedContent = content;
  let hasYouTubeEmbed = false;
  
  // 查找YouTube链接并替换为嵌入组件
  modifiedContent = modifiedContent.replace(
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[&?][^\s<]*)?/gi,
    (match, videoId) => {
      hasYouTubeEmbed = true;
      return `\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />\n`;
    }
  );
  
  // 如果找到了YouTube链接，添加导入语句
  if (hasYouTubeEmbed && !content.includes('import YouTubeEmbed')) {
    // 在frontmatter后添加导入语句
    modifiedContent = modifiedContent.replace(
      /^---\n([\s\S]*?)\n---\n/,
      (match, frontmatter) => {
        return `---\n${frontmatter}\n---\n\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";\n\n`;
      }
    );
  }
  
  return modifiedContent;
}

function processMdxFile(filePath) {
  try {
    console.log(`🔧 处理文件: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = convertYouTubeLinks(content);
    
    if (content !== modifiedContent) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`✅ 已修复: ${path.basename(filePath)}`);
      return true;
    } else {
      console.log(`📋 无需修复: ${path.basename(filePath)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 处理失败: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

function fixYouTubeLinks() {
  console.log('🔧 YouTube链接修复脚本启动');
  console.log(`📂 文章目录: ${articlesDir}`);
  
  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }
  
  const items = fs.readdirSync(articlesDir);
  let filesFixed = 0;
  let totalFiles = 0;
  
  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        totalFiles++;
        const wasFixed = processMdxFile(mdxPath);
        if (wasFixed) {
          filesFixed++;
        }
      }
    }
  }
  
  console.log('\n📊 修复结果摘要:');
  console.log(`📁 总文件数: ${totalFiles}`);
  console.log(`🔧 已修复: ${filesFixed}`);
  console.log(`📋 无需修复: ${totalFiles - filesFixed}`);
  
  if (filesFixed > 0) {
    console.log('\n🎉 YouTube链接修复完成！');
    console.log('💡 现在可以访问 http://localhost:4323 查看嵌入的YouTube视频');
  } else {
    console.log('\n📝 没有发现需要修复的YouTube链接');
  }
}

fixYouTubeLinks(); 