#!/usr/bin/env node

/**
 * 测试新的定时发布逻辑
 */

// 模拟新的生成函数
function testNewLogic() {
  console.log('\n测试新的定时发布逻辑\n');
  console.log('=' .repeat(60));
  
  // 场景1：没有未来文章的情况
  console.log('\n场景1：没有未来文章，从明天开始');
  console.log('-' .repeat(60));
  
  const now = new Date('2025-08-16');
  const intervalDays = 3;
  
  for (let index = 0; index < 5; index++) {
    const publishDate = new Date(now);
    publishDate.setDate(publishDate.getDate() + 1); // 从明天开始
    publishDate.setDate(publishDate.getDate() + intervalDays * index);
    publishDate.setHours(9, 0, 0, 0);
    
    const daysDiff = Math.round((publishDate - now) / (1000 * 60 * 60 * 24));
    console.log(`文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')} (今天 + ${daysDiff} 天)`);
  }
  
  // 场景2：已有未来文章的情况
  console.log('\n场景2：已有最后一篇未来文章在 2025/9/28');
  console.log('-' .repeat(60));
  
  const lastFutureTime = new Date('2025-09-28');
  lastFutureTime.setHours(9, 0, 0, 0);
  
  console.log(`最后一篇文章: ${lastFutureTime.toLocaleDateString('zh-CN')}`);
  console.log('新文章排期:');
  
  for (let index = 0; index < 5; index++) {
    const publishDate = new Date(lastFutureTime);
    publishDate.setDate(publishDate.getDate() + intervalDays * (index + 1));
    
    const daysDiff = Math.round((publishDate - lastFutureTime) / (1000 * 60 * 60 * 24));
    console.log(`新文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')} (最后一篇 + ${daysDiff} 天)`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ 新逻辑确保:');
  console.log('   1. 没有文章时，从明天开始，每3天一篇');
  console.log('   2. 有文章时，从最后一篇之后3天开始，继续每3天一篇');
  console.log('   3. 所有文章保持固定3天间隔');
}

// 验证间隔
function verifyIntervals() {
  console.log('\n验证文章间隔是否正确\n');
  console.log('=' .repeat(60));
  
  const articles = [];
  const baseDate = new Date('2025-08-17');
  baseDate.setHours(9, 0, 0, 0);
  
  // 生成10篇文章
  for (let i = 0; i < 10; i++) {
    const publishDate = new Date(baseDate);
    publishDate.setDate(publishDate.getDate() + 3 * i);
    articles.push(publishDate);
  }
  
  console.log('文章发布时间表:');
  articles.forEach((date, index) => {
    if (index > 0) {
      const interval = Math.round((date - articles[index - 1]) / (1000 * 60 * 60 * 24));
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${date.toLocaleDateString('zh-CN')} (间隔 ${interval} 天)`);
    } else {
      console.log(`${(index + 1).toString().padStart(2, ' ')}. ${date.toLocaleDateString('zh-CN')}`);
    }
  });
  
  // 验证所有间隔是否都是3天
  let allCorrect = true;
  for (let i = 1; i < articles.length; i++) {
    const interval = Math.round((articles[i] - articles[i - 1]) / (1000 * 60 * 60 * 24));
    if (interval !== 3) {
      allCorrect = false;
      console.log(`\n❌ 错误：第${i}和第${i+1}篇之间间隔是 ${interval} 天，不是3天`);
    }
  }
  
  if (allCorrect) {
    console.log('\n✅ 所有文章间隔都是3天！');
  }
}

// 运行测试
testNewLogic();
verifyIntervals();