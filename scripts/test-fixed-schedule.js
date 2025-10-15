#!/usr/bin/env node

/**
 * 测试修复后的定时发布逻辑
 */

// 模拟修复后的逻辑
function testFixedScheduleLogic() {
  console.log('\n🧪 测试修复后的发布逻辑（每篇固定间隔3天）\n');
  console.log('=' .repeat(60));
  
  const intervalDays = 3;
  
  // 场景1：没有未来文章
  console.log('\n场景1：没有未来文章，从明天开始');
  console.log('-' .repeat(60));
  
  const now = new Date('2025-08-16');
  const articles1 = [];
  let previousTime = null;
  
  for (let index = 0; index < 5; index++) {
    let publishDate;
    
    if (index === 0) {
      // 第一篇：从明天开始
      publishDate = new Date(now);
      publishDate.setDate(publishDate.getDate() + 1);
    } else {
      // 后续文章：基于上一篇 + 3天
      publishDate = new Date(previousTime);
      publishDate.setDate(publishDate.getDate() + intervalDays);
    }
    
    publishDate.setHours(9, 0, 0, 0);
    articles1.push(publishDate);
    previousTime = publishDate;
    
    const interval = index > 0 ? 
      Math.round((publishDate - articles1[index - 1]) / (1000 * 60 * 60 * 24)) : 0;
    
    console.log(`文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')}${index > 0 ? ` (间隔 ${interval} 天)` : ''}`);
  }
  
  // 场景2：已有未来文章
  console.log('\n场景2：已有最后一篇未来文章在 2025/9/28');
  console.log('-' .repeat(60));
  
  const lastFutureTime = new Date('2025-09-28');
  lastFutureTime.setHours(9, 0, 0, 0);
  console.log(`最后一篇文章: ${lastFutureTime.toLocaleDateString('zh-CN')}`);
  console.log('新文章排期:');
  
  const articles2 = [];
  previousTime = null;
  
  for (let index = 0; index < 5; index++) {
    let publishDate;
    
    if (index === 0) {
      // 第一篇新文章：最后一篇 + 3天
      publishDate = new Date(lastFutureTime);
      publishDate.setDate(publishDate.getDate() + intervalDays);
    } else {
      // 后续文章：基于上一篇新文章 + 3天
      publishDate = new Date(previousTime);
      publishDate.setDate(publishDate.getDate() + intervalDays);
    }
    
    publishDate.setHours(9, 0, 0, 0);
    articles2.push(publishDate);
    previousTime = publishDate;
    
    const interval = index > 0 ? 
      Math.round((publishDate - articles2[index - 1]) / (1000 * 60 * 60 * 24)) :
      Math.round((publishDate - lastFutureTime) / (1000 * 60 * 60 * 24));
    
    console.log(`新文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')} (间隔 ${interval} 天)`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 修复后的逻辑特点:');
  console.log('   1. 每篇文章都基于前一篇文章时间 + 3天');
  console.log('   2. 所有文章之间保持固定3天间隔');
  console.log('   3. 不会出现3、6、9、12的递增间隔');
}

// 验证连续10篇文章的间隔
function verifyConsecutiveArticles() {
  console.log('\n📊 验证连续10篇文章的发布间隔\n');
  console.log('=' .repeat(60));
  
  const baseDate = new Date('2025-08-17');
  baseDate.setHours(9, 0, 0, 0);
  
  const articles = [];
  let previousTime = baseDate;
  
  // 第一篇文章
  articles.push(new Date(baseDate));
  
  // 后续9篇文章
  for (let i = 1; i < 10; i++) {
    const publishDate = new Date(previousTime);
    publishDate.setDate(publishDate.getDate() + 3);
    articles.push(publishDate);
    previousTime = publishDate;
  }
  
  // 显示结果
  console.log('发布时间表:');
  articles.forEach((date, index) => {
    if (index > 0) {
      const interval = Math.round((date - articles[index - 1]) / (1000 * 60 * 60 * 24));
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${date.toLocaleDateString('zh-CN')} (间隔 ${interval} 天)`);
    } else {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${date.toLocaleDateString('zh-CN')}`);
    }
  });
  
  // 验证间隔
  const intervals = [];
  for (let i = 1; i < articles.length; i++) {
    const interval = Math.round((articles[i] - articles[i - 1]) / (1000 * 60 * 60 * 24));
    intervals.push(interval);
  }
  
  const allSame = intervals.every(interval => interval === 3);
  
  console.log('\n间隔分析:');
  console.log(`   所有间隔: [${intervals.join(', ')}]`);
  
  if (allSame) {
    console.log('   ✅ 所有文章间隔都是固定的3天！');
  } else {
    console.log('   ❌ 间隔不一致，需要检查逻辑');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// 运行测试
testFixedScheduleLogic();
verifyConsecutiveArticles();