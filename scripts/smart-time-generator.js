#!/usr/bin/env node

/**
 * 智能时间生成器
 * 确保新文章的发布时间始终比现有文章更新
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取现有文章的最新发布时间
 * @returns {Date|null} 最新文章的发布时间
 */
export function getLatestArticleTime() {
  const articlesDir = path.join(__dirname, '../src/content/articles');
  
  if (!fs.existsSync(articlesDir)) {
    return null;
  }

  let latestTime = null;
  
  try {
    const articleDirs = fs.readdirSync(articlesDir);
    
    for (const dir of articleDirs) {
      const mdxPath = path.join(articlesDir, dir, 'index.mdx');
      
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        const timeMatch = content.match(/publishedTime: (.+)/);
        
        if (timeMatch) {
          const articleTime = new Date(timeMatch[1]);
          if (!latestTime || articleTime > latestTime) {
            latestTime = articleTime;
          }
        }
      }
    }
  } catch (error) {
    console.warn('获取最新文章时间时出错:', error.message);
    return null;
  }
  
  return latestTime;
}

/**
 * 生成新文章的发布时间，确保比现有文章更新
 * @param {number} articleCount - 要生成的新文章数量
 * @param {number} index - 当前文章在新文章中的索引（0是最新的）
 * @returns {Date} 新的发布时间
 */
export function generateSmartPublishTime(articleCount, index) {
  const now = new Date();
  const latestExistingTime = getLatestArticleTime();
  
  // 设置新文章的基准开始时间：现有最新文章后10分钟，或当前时间前3个月
  const baseStartTime = latestExistingTime ? 
    new Date(latestExistingTime.getTime() + 10 * 60 * 1000) : // 最新文章10分钟后
    new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // 3个月前
  
  // 设置时间跨度：从baseStartTime到现在（确保不生成未来时间）
  const endTime = now; // 始终使用当前时间作为结束时间
  
  // 计算时间跨度
  const timeRange = endTime.getTime() - baseStartTime.getTime();
  const timeStep = timeRange / (articleCount + 1);
  
  // 为当前文章分配时间（index=0是最老的，index=articleCount-1是最新的）
  const articleTime = new Date(baseStartTime.getTime() + timeStep * (index + 1));
  
  // 添加小范围随机偏移（±30分钟）
  const randomOffset = (Math.random() - 0.5) * 60 * 60 * 1000; // ±30分钟
  articleTime.setTime(articleTime.getTime() + randomOffset);
  
  // 确保时间不早于基准开始时间
  if (articleTime < baseStartTime) {
    articleTime.setTime(baseStartTime.getTime() + Math.random() * 30 * 60 * 1000); // 基准时间后30分钟内
  }
  
  // 设置合理的发布时间（工作时间）
  const hours = 9 + Math.floor(Math.random() * 9); // 9-17点
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);
  
  articleTime.setHours(hours, minutes, seconds, Math.floor(Math.random() * 1000));
  
  return articleTime;
}

/**
 * 批量生成新文章时间，确保时间顺序正确
 * @param {number} articleCount - 文章数量
 * @returns {Date[]} 按时间顺序排列的发布时间数组
 */
export function generateBatchPublishTimes(articleCount) {
  const now = new Date();
  const latestExistingTime = getLatestArticleTime();
  
  // 设置新文章的基准开始时间：现有最新文章后10分钟，或当前时间前3个月
  const baseStartTime = latestExistingTime ? 
    new Date(latestExistingTime.getTime() + 10 * 60 * 1000) : // 最新文章10分钟后
    new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // 3个月前
  
  // 设置时间跨度：从baseStartTime到现在（确保不生成未来时间）
  const endTime = now; // 始终使用当前时间作为结束时间
  
  // 计算时间跨度
  const timeRange = endTime.getTime() - baseStartTime.getTime();
  const timeStep = timeRange / (articleCount + 1);
  
  const times = [];
  
  for (let i = 0; i < articleCount; i++) {
    // 为当前文章分配时间（i=0是最老的，i=articleCount-1是最新的）
    const articleTime = new Date(baseStartTime.getTime() + timeStep * (i + 1));
    
    // 添加小范围随机偏移（±30分钟）
    const randomOffset = (Math.random() - 0.5) * 60 * 60 * 1000; // ±30分钟
    articleTime.setTime(articleTime.getTime() + randomOffset);
    
    // 确保时间不早于基准开始时间
    if (articleTime < baseStartTime) {
      articleTime.setTime(baseStartTime.getTime() + Math.random() * 30 * 60 * 1000); // 基准时间后30分钟内
    }
    
    // 设置合理的发布时间（工作时间）
    const hours = 9 + Math.floor(Math.random() * 9); // 9-17点
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    
    articleTime.setHours(hours, minutes, seconds, Math.floor(Math.random() * 1000));
    
    // 确保时间不超过当前时间
    if (articleTime > now) {
      articleTime.setTime(now.getTime() - Math.random() * 60 * 60 * 1000); // 当前时间前1小时内
    }
    
    times.push(articleTime);
  }
  
  // 确保时间顺序正确（从早到晚）
  times.sort((a, b) => a.getTime() - b.getTime());
  
  return times;
}

/**
 * 测试时间生成功能
 */
function testTimeGeneration() {
  console.log('🧪 智能时间生成器测试\n');
  
  const latestTime = getLatestArticleTime();
  console.log(`📅 现有最新文章时间: ${latestTime ? latestTime.toLocaleString() : '无现有文章'}`);
  console.log(`📅 现在时间: ${new Date().toLocaleString()}`);
  
  const testCount = 3;
  console.log(`🔢 测试生成 ${testCount} 篇新文章的时间:\n`);
  
  // 调试：显示计算过程
  const now = new Date();
  const baseStartTime = latestTime ? 
    new Date(latestTime.getTime() + 10 * 60 * 1000) : 
    new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000);
  const endTime = now; // 始终使用当前时间作为结束时间，避免生成未来时间
    
  console.log(`🔧 基准开始时间: ${baseStartTime.toLocaleString()}`);
  console.log(`🔧 结束时间: ${endTime.toLocaleString()}\n`);
  
  const times = generateBatchPublishTimes(testCount);
  
  times.forEach((time, index) => {
    console.log(`  📄 文章 ${index + 1}: ${time.toLocaleString()} (${time.toISOString()})`);
  });
  
  console.log(`\n✅ 时间范围: ${times[0].toLocaleString()} 到 ${times[times.length - 1].toLocaleString()}`);
  
  if (latestTime) {
    const isAfterLatest = times.every(time => time > latestTime);
    console.log(`🕐 所有新文章时间${isAfterLatest ? '✅ 都晚于' : '❌ 存在早于'}现有最新文章`);
    
    if (!isAfterLatest) {
      console.log('\n🔍 详细检查:');
      times.forEach((time, index) => {
        const isAfter = time > latestTime;
        console.log(`  文章 ${index + 1}: ${isAfter ? '✅' : '❌'} ${time.toLocaleString()}`);
      });
    }
  }
}

// 如果直接运行此脚本，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testTimeGeneration();
}