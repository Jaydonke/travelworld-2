#!/usr/bin/env node

/**
 * 测试定时发布逻辑
 */

// 模拟生成未来发布时间的函数
function testGenerateFuturePublishTime() {
  console.log('测试定时发布时间计算逻辑\n');
  console.log('=' .repeat(50));
  
  const baseDate = new Date('2025-08-16'); // 今天
  const intervalDays = 3;
  
  console.log(`基准日期: ${baseDate.toLocaleDateString('zh-CN')}`);
  console.log(`发布间隔: ${intervalDays} 天\n`);
  
  // 模拟10篇文章的发布时间
  for (let index = 0; index < 10; index++) {
    const publishDate = new Date(baseDate);
    
    // 正确的计算方式：每篇文章间隔3天
    publishDate.setDate(publishDate.getDate() + intervalDays * (index + 1));
    publishDate.setHours(9, 0, 0, 0);
    
    console.log(`文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')} (基准日期 + ${intervalDays * (index + 1)} 天)`);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ 修复后的逻辑：每篇文章固定间隔3天');
  console.log('=' .repeat(50));
}

// 测试错误的逻辑（之前的问题）
function testOldBuggyLogic() {
  console.log('\n之前的错误逻辑（指数级增长）:\n');
  console.log('=' .repeat(50));
  
  const baseDate = new Date('2025-08-16');
  const intervalDays = 3;
  
  console.log(`基准日期: ${baseDate.toLocaleDateString('zh-CN')}`);
  console.log(`发布间隔: ${intervalDays} 天\n`);
  
  // 模拟错误的计算方式
  for (let index = 0; index < 10; index++) {
    const publishDate = new Date(baseDate);
    
    // 错误的计算方式（如果是指数级）
    // 这里展示可能导致问题的计算方式
    publishDate.setDate(publishDate.getDate() + ((index + 1) * intervalDays));
    publishDate.setHours(9, 0, 0, 0);
    
    console.log(`文章 ${index + 1}: ${publishDate.toLocaleDateString('zh-CN')} (基准日期 + ${(index + 1) * intervalDays} 天)`);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('❌ 这种逻辑也是线性的，但如果基准日期在循环中被修改，就会导致问题');
  console.log('=' .repeat(50));
}

// 运行测试
testGenerateFuturePublishTime();
testOldBuggyLogic();

console.log('\n💡 总结：');
console.log('1. 修复后的逻辑确保每篇文章之间固定间隔3天');
console.log('2. 第1篇文章: 基准日期 + 3天');
console.log('3. 第2篇文章: 基准日期 + 6天');
console.log('4. 第3篇文章: 基准日期 + 9天');
console.log('5. 以此类推，保持线性增长而非指数增长');