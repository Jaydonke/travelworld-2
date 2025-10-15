#!/usr/bin/env node

/**
 * 调试YouTube转换问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFile = path.join(__dirname, '../newarticle/Cozy Up with DIY Reading Nooks Tips and Tricks.html');
const htmlContent = fs.readFileSync(htmlFile, 'utf8');

// 提取包含YouTube链接的部分
const startIndex = htmlContent.indexOf('If you still need focused light');
const endIndex = htmlContent.indexOf('Style it up: art frames') + 50;
const relevantSection = htmlContent.substring(startIndex, endIndex);

console.log('原始HTML片段:');
console.log(relevantSection);
console.log('\n' + '='.repeat(60) + '\n');

// 模拟add-articles-improved.js的处理流程
let content = relevantSection;

console.log('步骤1: 处理YouTube链接之前的内容');
console.log('内容中是否包含YouTube链接:', content.includes('youtube.com/watch'));
console.log('\n');

// processYouTubeLinks函数
function processYouTubeLinks(content) {
  let hasYouTube = false;
  let processedContent = content;

  // 匹配多种YouTube URL格式
  const youtubePatterns = [
    // 在center标签内的p标签
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    /<center[^>]*>\s*<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>\s*<\/center>/gi,
    // 标准watch URL在p标签内
    /<p[^>]*>\s*(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    // 短链接在p标签内
    /<p[^>]*>\s*(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)[^\s<]*)\s*<\/p>/gi,
    // 纯文本YouTube链接（不在标签内）
    /(?<!["|'])https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi,
    /(?<!["|'])https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(?![^<]*<\/a>)/gi
  ];

  youtubePatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      console.log(`模式${index + 1}匹配到: ${matches[0]}`);
      processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
        hasYouTube = true;
        const actualVideoId = videoId || urlOrVideoId;
        const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
        const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
        
        const replacement = `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
        console.log(`  替换为: ${replacement.trim()}`);
        return replacement;
      });
    }
  });

  return { content: processedContent, hasYouTube };
}

console.log('步骤2: 处理YouTube链接');
const youtubeResult = processYouTubeLinks(content);
content = youtubeResult.content;
console.log('处理后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
console.log('\n处理后的内容:');
console.log(content);
console.log('\n' + '='.repeat(60) + '\n');

// 继续后续处理
console.log('步骤3: 处理<p>标签');
content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
console.log('处理后的内容:');
console.log(content);

console.log('\n' + '='.repeat(60) + '\n');
console.log('结论:');
if (content.includes('YouTubeEmbed')) {
  console.log('✅ YouTube组件被保留了');
} else {
  console.log('❌ YouTube组件在处理过程中丢失了');
}