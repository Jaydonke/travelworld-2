#!/usr/bin/env node

/**
 * 详细调试YouTube转换问题
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取实际的HTML文件
const htmlFile = path.join(__dirname, '../newarticle/Authenticities Walking holidays Unique Guided Tours.html');
const htmlContent = fs.readFileSync(htmlFile, 'utf8');

// 找到YouTube链接的确切位置
const youtubeIndex = htmlContent.indexOf('https://www.youtube.com/watch?v=-J9Hk_Gvzf4');
if (youtubeIndex === -1) {
  console.log('❌ 在HTML中没有找到YouTube链接');
  process.exit(1);
}

// 提取YouTube链接周围的内容
const start = Math.max(0, youtubeIndex - 200);
const end = Math.min(htmlContent.length, youtubeIndex + 200);
const context = htmlContent.substring(start, end);

console.log('📍 YouTube链接在HTML中的上下文:');
console.log('=' + '='.repeat(60));
console.log(context);
console.log('=' + '='.repeat(60));
console.log();

// 现在测试processYouTubeLinks函数
function processYouTubeLinks(content) {
  let hasYouTube = false;
  let processedContent = content;

  console.log('🔍 开始处理YouTube链接...');
  console.log('原始内容包含YouTube:', content.includes('youtube.com/watch'));

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
    console.log(`\n测试模式 ${index + 1}:`, pattern.toString());
    
    const matches = processedContent.match(pattern);
    if (matches) {
      console.log(`  ✅ 匹配到 ${matches.length} 个: ${matches[0]}`);
      
      processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
        hasYouTube = true;
        console.log(`    匹配参数: match="${match}", urlOrVideoId="${urlOrVideoId}", videoId="${videoId}"`);
        
        const actualVideoId = videoId || urlOrVideoId;
        const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
        const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
        
        const replacement = `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
        console.log(`    替换为: ${replacement.trim()}`);
        
        return replacement;
      });
    } else {
      console.log(`  ❌ 没有匹配`);
    }
  });

  console.log(`\n🎯 处理结果:`);
  console.log(`  - 包含YouTube: ${hasYouTube}`);
  console.log(`  - 处理后包含YouTubeEmbed: ${processedContent.includes('YouTubeEmbed')}`);

  return { content: processedContent, hasYouTube };
}

// 测试YouTube转换
console.log('🧪 测试YouTube链接转换...\n');
const result = processYouTubeLinks(context);

console.log('\n📄 转换后的内容:');
console.log('-'.repeat(60));
console.log(result.content);
console.log('-'.repeat(60));

console.log('\n✅ 测试完成');
console.log(`🎬 是否检测到YouTube: ${result.hasYouTube}`);
console.log(`📺 是否生成YouTubeEmbed: ${result.content.includes('YouTubeEmbed')}`);