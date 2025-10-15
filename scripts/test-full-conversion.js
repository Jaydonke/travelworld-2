#!/usr/bin/env node

/**
 * 测试完整的HTML到MDX转换过程
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从add-articles-improved.js复制关键函数
function processYouTubeLinks(content) {
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

  youtubePatterns.forEach(pattern => {
    processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
      hasYouTube = true;
      const actualVideoId = videoId || urlOrVideoId;
      const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
      const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
      
      return `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
    });
  });

  return { content: processedContent, hasYouTube };
}

// 模拟extractContentFromHTML函数的关键部分
function testExtractContent() {
  console.log('🧪 测试完整的内容提取过程...\n');

  const htmlFile = path.join(__dirname, '../newarticle/Authenticities Walking holidays Unique Guided Tours.html');
  let htmlContent = fs.readFileSync(htmlFile, 'utf8');

  // 找到YouTube链接周围的较大区块进行测试
  const startPattern = 'Georgia\'s Svaneti';
  const endPattern = 'Montenegro and China';
  
  let startIndex = htmlContent.indexOf('Georgia\'s Svaneti');
  let endIndex = htmlContent.indexOf('Montenegro and China');
  
  if (startIndex === -1 || endIndex === -1) {
    // 备用方案
    startIndex = htmlContent.indexOf('https://www.youtube.com/watch?v=-J9Hk_Gvzf4') - 500;
    endIndex = htmlContent.indexOf('https://www.youtube.com/watch?v=-J9Hk_Gvzf4') + 500;
  }
  
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(htmlContent.length, endIndex + 500);
  
  let content = htmlContent.substring(startIndex, endIndex);
  
  console.log('原始HTML片段:');
  console.log('='.repeat(70));
  console.log(content.substring(0, 300) + '...');
  console.log('包含YouTube链接:', content.includes('youtube.com/watch'));
  console.log();

  // 步骤1: 处理YouTube链接
  console.log('步骤1: 处理YouTube链接');
  const youtubeResult = processYouTubeLinks(content);
  content = youtubeResult.content;
  console.log('YouTube转换结果:', youtubeResult.hasYouTube);
  console.log('包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  console.log();

  // 步骤2: 移除center标签
  console.log('步骤2: 移除center标签');
  content = content.replace(/<center[^>]*>([\s\S]*?)<\/center>/gi, '$1');
  console.log('仍包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  console.log();

  // 步骤3: 处理段落标签
  console.log('步骤3: 处理段落标签');
  const beforeP = content.includes('YouTubeEmbed');
  content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  console.log('处理<p>标签前包含YouTubeEmbed:', beforeP);
  console.log('处理<p>标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  console.log();

  // 步骤4: 其他清理
  console.log('步骤4: 其他清理步骤');
  
  // 处理粗体/斜体
  content = content.replace(/<strong[^>]*>([^<]+)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>([^<]+)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>([^<]+)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>([^<]+)<\/i>/gi, '*$1*');
  console.log('处理格式标签后包含YouTubeEmbed:', content.includes('YouTubeEmbed'));

  // 最终清理
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();
  
  console.log('\n最终处理结果:');
  console.log('='.repeat(70));
  console.log(content);
  console.log('\n最终包含YouTubeEmbed:', content.includes('YouTubeEmbed'));
  
  return {
    content,
    hasYouTube: youtubeResult.hasYouTube
  };
}

// 运行测试
const result = testExtractContent();

console.log('\n📊 测试总结:');
console.log(`- 检测到YouTube: ${result.hasYouTube}`);
console.log(`- 最终包含YouTubeEmbed: ${result.content.includes('YouTubeEmbed')}`);

if (result.hasYouTube && !result.content.includes('YouTubeEmbed')) {
  console.log('\n❌ 问题: YouTube链接被检测到但YouTubeEmbed组件丢失了！');
} else if (result.hasYouTube && result.content.includes('YouTubeEmbed')) {
  console.log('\n✅ 成功: YouTube链接正确转换为YouTubeEmbed组件！');
} else {
  console.log('\n⚠️  没有检测到YouTube链接');
}