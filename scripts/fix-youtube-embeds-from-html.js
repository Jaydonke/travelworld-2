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

// 从HTML文件中提取YouTube视频ID
function findYouTubeInHTML(htmlContent) {
  const regex = /<p[^>]*>https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^<]*<\/p>/gi;
  const matches = [];
  let match;
  
  while ((match = regex.exec(htmlContent)) !== null) {
    matches.push({
      videoId: match[1],
      fullMatch: match[0]
    });
  }
  
  return matches;
}

// 检查MDX文件是否缺少YouTube嵌入
function checkMDXForYouTubeEmbed(mdxContent, videoId) {
  return mdxContent.includes(`videoId="${videoId}"`);
}

// 在MDX内容中找到合适的位置插入YouTube嵌入
function insertYouTubeEmbed(mdxContent, videoId, htmlContent) {
  // 尝试找到YouTube链接在HTML中的上下文
  const contextRegex = new RegExp(`<h[23][^>]*>([^<]+)<\/h[23]>[\\s\\S]*?<p[^>]*>https?:\/\/(?:www\.)?youtube\.com\/watch\\?v=${videoId}[^<]*<\/p>`, 'gi');
  const contextMatch = htmlContent.match(contextRegex);
  
  if (contextMatch) {
    const heading = contextMatch[0].match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)[1];
    
    // 在MDX中找到对应的标题
    const headingRegex = new RegExp(`##+ ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    const headingIndex = mdxContent.search(headingRegex);
    
    if (headingIndex !== -1) {
      // 找到标题后的下一个段落位置
      const afterHeading = mdxContent.substring(headingIndex);
      const nextParagraphMatch = afterHeading.match(/\n\n([^#\n][^\n]*)/);
      
      if (nextParagraphMatch) {
        const insertIndex = headingIndex + afterHeading.indexOf(nextParagraphMatch[0]) + nextParagraphMatch[0].length;
        
        // 插入YouTube嵌入
        const embedCode = `\n\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />`;
        return mdxContent.slice(0, insertIndex) + embedCode + mdxContent.slice(insertIndex);
      }
    }
  }
  
  return null;
}

// 添加import语句如果需要
function addYouTubeImport(mdxContent) {
  if (!mdxContent.includes('import YouTubeEmbed') && mdxContent.includes('<YouTubeEmbed')) {
    const frontmatterEnd = mdxContent.indexOf('---', 3) + 3;
    return mdxContent.slice(0, frontmatterEnd) + '\n\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";' + mdxContent.slice(frontmatterEnd);
  }
  return mdxContent;
}

async function processArticle(articleSlug, specificHtmlFile = null) {
  let htmlPath;
  
  if (specificHtmlFile) {
    htmlPath = path.join(CONFIG.newArticlesDir, specificHtmlFile);
  } else {
    const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir);
    const htmlFile = htmlFiles.find(file => 
      file.toLowerCase().includes(articleSlug.toLowerCase().replace(/-/g, ' '))
    );
    
    if (!htmlFile) {
      console.log(`⚠️  找不到HTML文件: ${articleSlug}`);
      return false;
    }
    
    htmlPath = path.join(CONFIG.newArticlesDir, htmlFile);
  }
  
  if (!fs.existsSync(htmlPath)) {
    console.log(`⚠️  HTML文件不存在: ${htmlPath}`);
    return false;
  }
  
  const mdxPath = path.join(CONFIG.articlesDir, articleSlug, 'index.mdx');
  if (!fs.existsSync(mdxPath)) {
    console.log(`⚠️  找不到MDX文件: ${articleSlug}`);
    return false;
  }
  
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  let mdxContent = fs.readFileSync(mdxPath, 'utf8');
  
  const youtubeMatches = findYouTubeInHTML(htmlContent);
  
  if (youtubeMatches.length === 0) {
    console.log(`📋 没有YouTube链接: ${articleSlug}`);
    return false;
  }
  
  let modified = false;
  
  for (const { videoId } of youtubeMatches) {
    if (!checkMDXForYouTubeEmbed(mdxContent, videoId)) {
      console.log(`🔧 添加YouTube嵌入 (${videoId}): ${articleSlug}`);
      
      const newContent = insertYouTubeEmbed(mdxContent, videoId, htmlContent);
      if (newContent) {
        mdxContent = newContent;
        modified = true;
      } else {
        console.log(`⚠️  无法定位插入位置，将在文末添加: ${videoId}`);
        // 如果找不到合适位置，在文末添加
        const lastHeadingIndex = mdxContent.lastIndexOf('\n##');
        if (lastHeadingIndex !== -1) {
          const insertIndex = mdxContent.indexOf('\n\n', lastHeadingIndex + 1);
          mdxContent = mdxContent.slice(0, insertIndex) + 
            `\n\n<YouTubeEmbed videoId="${videoId}" title="YouTube video" />` + 
            mdxContent.slice(insertIndex);
          modified = true;
        }
      }
    }
  }
  
  if (modified) {
    mdxContent = addYouTubeImport(mdxContent);
    fs.writeFileSync(mdxPath, mdxContent);
    console.log(`✅ 已修复: ${articleSlug}`);
    return true;
  }
  
  return false;
}

async function main() {
  console.log('🔧 YouTube嵌入修复脚本启动');
  console.log(`📂 HTML目录: ${CONFIG.newArticlesDir}`);
  console.log(`📂 文章目录: ${CONFIG.articlesDir}`);
  
  // 获取所有可能包含YouTube的文章 - 映射到正确的HTML文件名
  const articlesToCheck = [
    { slug: 'video-marketing-experts-boost-your-online-presence', htmlFile: 'Video Marketing Experts_ Boost Your Online Presence.html' },
    { slug: 'beginner-investing-a-step-by-step-guide-to-investing', htmlFile: 'Beginner Investing A Step-by-Step Guide to Investing.html' },
    { slug: 'streamline-your-social-media-with-powerful-management-solutions', htmlFile: 'Streamline Your Social Media with Powerful Management Solutions.html' }
  ];
  
  let fixed = 0;
  
  for (const { slug, htmlFile } of articlesToCheck) {
    if (await processArticle(slug, htmlFile)) {
      fixed++;
    }
  }
  
  console.log(`\n🎉 修复完成！`);
  console.log(`📊 共修复 ${fixed} 篇文章`);
}

main().catch(console.error);