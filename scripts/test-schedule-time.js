#!/usr/bin/env node

/**
 * 测试定时发布时间生成
 */

// 模拟配置
const CONFIG = {
  scheduleSettings: {
    startFromTomorow: true,
    publishInterval: 'every-3-days',
    publishTime: '09:00',
    randomizeTime: false, // 关闭随机化以便测试
    maxFuturedays: 90
  }
};

function generateFuturePublishTime(index, totalCount) {
  const now = new Date();
  const settings = CONFIG.scheduleSettings;
  
  // 计算开始发布日期：从今天开始3天后
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 3); // 固定3天后开始
  
  // 计算发布间隔（天数）
  let intervalDays = 3; // 固定3天间隔
  if (settings.publishInterval === 'daily') {
    intervalDays = 1;
  } else if (settings.publishInterval === 'twice-daily') {
    intervalDays = 0.5;
  } else if (settings.publishInterval === 'weekly') {
    intervalDays = 7;
  } else if (settings.publishInterval === 'every-3-days') {
    intervalDays = 3;
  }
  
  // 为每篇文章计算发布时间
  const publishDate = new Date(startDate);
  publishDate.setTime(startDate.getTime() + (index * intervalDays * 24 * 60 * 60 * 1000));
  
  // 设置发布时间
  const [hours, minutes] = settings.publishTime.split(':').map(Number);
  publishDate.setHours(hours, minutes, 0, 0);
  
  // 随机化时间（如果启用）
  if (settings.randomizeTime) {
    const randomMinutes = (Math.random() - 0.5) * 240; // ±2小时
    publishDate.setMinutes(publishDate.getMinutes() + randomMinutes);
  }
  
  // 确保不超过最大未来天数（从今天开始计算）
  const maxFutureDate = new Date(now);
  maxFutureDate.setDate(maxFutureDate.getDate() + settings.maxFuturedays);
  
  if (publishDate > maxFutureDate) {
    publishDate.setTime(maxFutureDate.getTime());
  }
  
  return publishDate;
}

// 测试
const now = new Date();
console.log('当前时间:', now.toLocaleString('zh-CN'));
console.log('配置间隔:', CONFIG.scheduleSettings.publishInterval);
console.log('');

for (let i = 0; i < 5; i++) {
  const publishTime = generateFuturePublishTime(i, 5);
  const daysFromNow = Math.ceil((publishTime - now) / (24 * 60 * 60 * 1000));
  
  console.log(`文章 ${i + 1}:`);
  console.log(`  发布时间: ${publishTime.toLocaleString('zh-CN')}`);
  console.log(`  距今天数: ${daysFromNow} 天`);
  console.log('');
}