#!/usr/bin/env node

/**
 * Debug版本的文章添加脚本，专注于YouTube转换问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processYouTubeLinks(content) {
  console.log('🔍 processYouTubeLinks 开始执行');
  console.log('输入内容长度:', content.length);
  console.log('包含youtube.com/watch:', content.includes('youtube.com/watch'));
  
  let hasYouTube = false;
  let processedContent = content;

  const youtubePatterns = [
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    /<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    /<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    /(?<!["|'])https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi,
    /(?<!["|'])https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi
  ];

  youtubePatterns.forEach((pattern, index) => {
    const matches = processedContent.match(pattern);
    if (matches) {
      console.log(`✅ 模式 ${index + 1} 匹配到:`, matches[0]);
      processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
        hasYouTube = true;
        const actualVideoId = videoId || urlOrVideoId;
        const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
        const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
        
        const replacement = `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
        console.log(`🔄 替换为:`, replacement.trim());
        return replacement;
      });
    }
  });

  console.log('processYouTubeLinks 结果:');
  console.log('- hasYouTube:', hasYouTube);
  console.log('- 输出包含YouTubeEmbed:', processedContent.includes('YouTubeEmbed'));
  console.log('');

  return { content: processedContent, hasYouTube };
}

function extractContentFromHTML(htmlContent) {
  console.log('📄 extractContentFromHTML 开始执行');
  
  // 提取标题
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Debug Article';

  // 简化描述提取
  let description = 'Debug article for YouTube testing';

  // 提取正文内容
  let content = htmlContent;

  console.log('🧹 开始HTML清理...');

  // 移除HTML文档结构
  content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
  content = content.replace(/<html[^>]*>/gi, '');
  content = content.replace(/<\/html>/gi, '');
  content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  content = content.replace(/<body[^>]*>/gi, '');
  content = content.replace(/<\/body>/gi, '');
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  console.log('清理后包含YouTube链接:', content.includes('youtube.com/watch'));

  // 🔥 关键步骤：处理YouTube链接（必须在其他处理之前！）
  console.log('🎬 开始处理YouTube链接...');
  const youtubeResult = processYouTubeLinks(content);
  content = youtubeResult.content;
  const hasYouTube = youtubeResult.hasYouTube;

  console.log('YouTube处理完成，继续其他处理...');

  // 移除与标题重复的h1
  const titleForComparison = title.toLowerCase().trim();
  content = content.replace(/<h1[^>]*>([^<]+)<\/h1>/gi, (match, h1Content) => {
    const h1Text = h1Content.trim().toLowerCase();
    if (h1Text === titleForComparison) {
      return '';
    }
    return `# ${h1Content}\n\n`;
  });

  // 转换其他HTML标签
  content = content.replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n\n');

  // 处理段落和其他内联元素
  console.log('处理<p>标签前包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  console.log('处理<p>标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));

  // 处理格式
  content = content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*');
  console.log('处理格式标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));

  // 清理剩余标签
  console.log('清理center标签前包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  content = content.replace(/<center[^>]*>([\s\S]*?)<\/center>/gi, '$1');
  console.log('清理center标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  
  console.log('🚨 关键步骤：清理所有HTML标签前包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  // 🔥 修复：保留YouTubeEmbed组件
  content = content.replace(/<(?!\/?YouTubeEmbed)[^>]*>/g, '');
  console.log('🚨 清理所有HTML标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));

  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();

  console.log('最终结果:');
  console.log('- hasYouTube:', hasYouTube);
  console.log('- 内容包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  console.log('');

  return {
    title,
    description,
    content,
    hasYouTube,
    firstImageUrl: null
  };
}

// 测试主函数
async function main() {
  console.log('🚀 Debug版本文章处理启动\n');

  const htmlFile = path.join(__dirname, '../newarticle/Billings Montana Travel Guide Must-See Places.html');
  if (!fs.existsSync(htmlFile)) {
    console.log('❌ HTML文件不存在');
    return;
  }

  const htmlContent = fs.readFileSync(htmlFile, 'utf8');
  console.log('📖 读取HTML文件，长度:', htmlContent.length);

  // 处理内容
  const result = extractContentFromHTML(htmlContent);
  
  console.log('🎯 最终处理结果:');
  console.log('标题:', result.title);
  console.log('包含YouTube:', result.hasYouTube);
  console.log('内容包含YouTubeEmbed:', result.content.includes('YouTubeEmbed'));

  // 如果包含YouTube，显示相关部分
  if (result.hasYouTube || result.content.includes('YouTubeEmbed')) {
    console.log('\n📺 YouTube相关内容:');
    const lines = result.content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('YouTubeEmbed') || line.includes('Georgia') || line.includes('Svaneti')) {
        console.log(`${index + 1}: ${line}`);
      }
    });
  }

  // 写入测试文件
  const testDir = path.join(__dirname, '../src/content/blog/debug-youtube-test');
  const testMdx = path.join(testDir, 'index.mdx');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const frontmatter = `---
isDraft: false
isMainHeadline: false
isSubHeadline: false
description: "${result.description}"
title: "${result.title}"
categories:
  - "general"
publishedTime: 2025-08-17T12:00:00.000Z
authors:
  - blogtonic-team
cover: '@assets/images/articles/debug-youtube-test/cover.png'
---`;

  let imports = '';
  if (result.hasYouTube) {
    imports = '\nimport YouTubeEmbed from "@/components/YouTubeEmbed.astro";\n';
  }

  const fullContent = `${frontmatter}${imports}\n${result.content}`;
  
  fs.writeFileSync(testMdx, fullContent);
  console.log('\n✅ 测试文件已创建:', testMdx);
}

main().catch(console.error);