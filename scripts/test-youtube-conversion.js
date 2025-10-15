#!/usr/bin/env node

/**
 * 测试YouTube链接转换
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试HTML内容
const testHTML = `
<table>
<tr><td>Test</td></tr>
</table>
<h2>Setup and Optimization Tips for Real-Time Hydration Tracking</h2>
<p><strong>Small changes in fit, calibration, and context can make measurements far more useful in practice.</strong> Start by placing sensors where skin contact stays steady and movement won't break the seal.</p>
<center><p>https://www.youtube.com/watch?v=A_Gqt8UlB0k</p></center>
<p><em>Secure contact</em> reduces noise and improves signal quality during daily activity.</p>
`;

console.log('原始HTML:');
console.log(testHTML);
console.log('\n' + '='.repeat(60) + '\n');

// 测试processYouTubeLinks函数
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
    console.log(`测试模式 ${index + 1}: ${pattern}`);
    const matches = content.match(pattern);
    if (matches) {
      console.log(`  ✅ 匹配到: ${matches}`);
      processedContent = processedContent.replace(pattern, (match, urlOrVideoId, videoId) => {
        hasYouTube = true;
        // 如果第二个参数是URL，第三个参数是videoId
        const actualVideoId = videoId || urlOrVideoId;
        // 确保提取的是videoId而不是完整URL
        const idMatch = actualVideoId.match(/([a-zA-Z0-9_-]+)$/);
        const finalVideoId = idMatch ? idMatch[1] : actualVideoId;
        
        console.log(`  转换: ${match} -> <YouTubeEmbed videoId="${finalVideoId}" />`);
        return `\n<YouTubeEmbed videoId="${finalVideoId}" title="YouTube video" />\n`;
      });
    } else {
      console.log(`  ❌ 没有匹配`);
    }
  });

  return { content: processedContent, hasYouTube };
}

// 先处理YouTube链接
console.log('处理YouTube链接...\n');
const result1 = processYouTubeLinks(testHTML);
console.log('处理后的内容:');
console.log(result1.content);
console.log(`\n包含YouTube: ${result1.hasYouTube}`);

console.log('\n' + '='.repeat(60) + '\n');

// 现在测试完整的处理流程（模拟add-articles-improved.js的处理）
console.log('测试完整处理流程...\n');

let content = testHTML;

// 1. 先处理YouTube链接
const youtubeResult = processYouTubeLinks(content);
content = youtubeResult.content;
console.log('步骤1 - YouTube转换后:');
console.log(content.substring(0, 500));

// 2. 然后移除center标签（这是问题所在！）
content = content.replace(/<center[^>]*>([\s\S]*?)<\/center>/gi, '$1');
console.log('\n步骤2 - 移除center标签后:');
console.log(content.substring(0, 500));

// 3. 处理p标签
content = content.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
console.log('\n步骤3 - 处理p标签后:');
console.log(content.substring(0, 500));

console.log('\n' + '='.repeat(60) + '\n');
console.log('问题分析:');
console.log('YouTube链接被成功转换了，但在后续的HTML处理中可能被破坏。');
console.log('需要确保processYouTubeLinks在所有HTML标签处理之前运行。');