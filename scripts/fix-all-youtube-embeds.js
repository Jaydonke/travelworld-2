#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/articles')
};

// 将文章标题转换为slug
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// 从HTML文件中提取YouTube视频信息
function extractYouTubeFromHTML(htmlContent) {
  const videos = [];
  
  // 匹配在p标签中的YouTube链接
  const pRegex = /<p[^>]*>(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^<]*)<\/p>/gi;
  let match;
  
  while ((match = pRegex.exec(htmlContent)) !== null) {
    // 查找这个视频链接前面的最近的标题，用于定位插入位置
    const beforeVideo = htmlContent.substring(0, match.index);
    const lastHeadingMatch = beforeVideo.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi);
    const lastHeading = lastHeadingMatch ? lastHeadingMatch[lastHeadingMatch.length - 1].match(/>([^<]+)</)[1] : null;
    
    videos.push({
      videoId: match[2],
      fullUrl: match[1],
      precedingHeading: lastHeading,
      htmlContext: match[0]
    });
  }
  
  return videos;
}

// 在MDX内容中插入YouTube嵌入
function insertYouTubeEmbeds(mdxContent, videos) {
  let modifiedContent = mdxContent;
  let hasYouTubeEmbed = false;
  
  for (const video of videos) {
    // 检查是否已经存在这个视频的嵌入
    if (modifiedContent.includes(`videoId="${video.videoId}"`)) {
      console.log(`  ⏭️  视频已存在: ${video.videoId}`);
      continue;
    }
    
    hasYouTubeEmbed = true;
    console.log(`  🎬 添加视频: ${video.videoId}`);
    
    // 尝试根据标题定位插入位置
    if (video.precedingHeading) {
      // 清理标题文本，移除HTML实体
      const cleanHeading = video.precedingHeading
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      // 在MDX中查找对应的标题
      const headingRegex = new RegExp(`^#{2,3} ${cleanHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'mi');
      const headingMatch = modifiedContent.match(headingRegex);
      
      if (headingMatch) {
        const headingIndex = modifiedContent.indexOf(headingMatch[0]);
        const afterHeading = modifiedContent.substring(headingIndex + headingMatch[0].length);
        
        // 查找下一个非空段落
        const nextContentMatch = afterHeading.match(/\n\n([^#\n][^\n]*)/);
        
        if (nextContentMatch) {
          const insertIndex = headingIndex + headingMatch[0].length + afterHeading.indexOf(nextContentMatch[0]) + nextContentMatch[0].length;
          
          modifiedContent = 
            modifiedContent.slice(0, insertIndex) + 
            `\n\n<YouTubeEmbed videoId="${video.videoId}" title="YouTube video" />` + 
            modifiedContent.slice(insertIndex);
          
          continue;
        }
      }
    }
    
    // 如果找不到合适的位置，尝试在文章末尾的FAQ之前插入
    const faqIndex = modifiedContent.indexOf('\n## FAQ');
    if (faqIndex !== -1) {
      modifiedContent = 
        modifiedContent.slice(0, faqIndex) + 
        `\n<YouTubeEmbed videoId="${video.videoId}" title="YouTube video" />\n` + 
        modifiedContent.slice(faqIndex);
    } else {
      // 最后的选择：在文章末尾添加
      modifiedContent += `\n\n<YouTubeEmbed videoId="${video.videoId}" title="YouTube video" />`;
    }
  }
  
  // 如果添加了YouTube嵌入，确保有import语句
  if (hasYouTubeEmbed && !modifiedContent.includes('import YouTubeEmbed')) {
    const frontmatterEnd = modifiedContent.indexOf('---', 3) + 3;
    modifiedContent = 
      modifiedContent.slice(0, frontmatterEnd) + 
      '\n\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";' + 
      modifiedContent.slice(frontmatterEnd);
  }
  
  return { content: modifiedContent, modified: hasYouTubeEmbed };
}

async function processArticle(htmlFile) {
  const htmlPath = path.join(CONFIG.newArticlesDir, htmlFile);
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // 提取标题用于生成slug
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                     htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  if (!titleMatch) {
    console.log(`⚠️  无法提取标题: ${htmlFile}`);
    return false;
  }
  
  const title = titleMatch[1].trim();
  const slug = titleToSlug(title);
  const mdxPath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
  
  if (!fs.existsSync(mdxPath)) {
    console.log(`⚠️  MDX文件不存在: ${slug}`);
    return false;
  }
  
  console.log(`\n📄 处理: ${title}`);
  
  // 提取YouTube视频
  const videos = extractYouTubeFromHTML(htmlContent);
  
  if (videos.length === 0) {
    console.log(`  ℹ️  没有YouTube视频`);
    return false;
  }
  
  console.log(`  📺 找到 ${videos.length} 个YouTube视频`);
  
  // 读取并更新MDX文件
  const mdxContent = fs.readFileSync(mdxPath, 'utf8');
  const { content: updatedContent, modified } = insertYouTubeEmbeds(mdxContent, videos);
  
  if (modified) {
    fs.writeFileSync(mdxPath, updatedContent);
    console.log(`  ✅ 已更新MDX文件`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔧 批量修复YouTube嵌入脚本');
  console.log(`📂 HTML目录: ${CONFIG.newArticlesDir}`);
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  // 获取所有包含YouTube链接的HTML文件
  const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
    .filter(file => file.endsWith('.html'));
  
  let totalProcessed = 0;
  let totalFixed = 0;
  
  for (const htmlFile of htmlFiles) {
    try {
      const htmlContent = fs.readFileSync(path.join(CONFIG.newArticlesDir, htmlFile), 'utf8');
      if (htmlContent.includes('youtube.com/watch?v=')) {
        totalProcessed++;
        if (await processArticle(htmlFile)) {
          totalFixed++;
        }
      }
    } catch (error) {
      console.error(`❌ 处理失败 ${htmlFile}: ${error.message}`);
    }
  }
  
  console.log('\n📊 修复统计:');
  console.log(`📄 处理文件数: ${totalProcessed}`);
  console.log(`✅ 修复文件数: ${totalFixed}`);
  console.log(`🎉 完成！`);
}

main().catch(console.error);