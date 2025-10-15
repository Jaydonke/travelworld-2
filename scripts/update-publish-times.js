#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// 生成分布的时间范围：从3周前到现在
function generateDistributedTimes(count) {
  const times = [];
  const now = new Date(); // 使用当前系统时间
  const startTime = new Date('2025-06-01T00:00:00Z'); // 2025年6月1日开始

  for (let i = 0; i < count; i++) {
    // 在2025年6月到现在范围内随机分布
    const randomTime = new Date(startTime.getTime() + Math.random() * (now.getTime() - startTime.getTime()));

    // 确保时间在合理范围内（上午9点到下午6点）
    const hours = 9 + Math.floor(Math.random() * 9); // 9-17点
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);

    randomTime.setHours(hours, minutes, seconds, Math.floor(Math.random() * 1000));

    times.push(randomTime);
  }

  // 按时间排序，确保最新的文章时间最晚
  return times.sort((a, b) => a.getTime() - b.getTime());
}

function updatePublishTime(filePath, newTime) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // 替换publishedTime
    const updatedContent = content.replace(
      /publishedTime: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
      `publishedTime: ${newTime.toISOString()}`
    );

    fs.writeFileSync(filePath, updatedContent);
    return true;
  } catch (error) {
    console.error(`❌ 更新失败: ${path.basename(filePath)} - ${error.message}`);
    return false;
  }
}

function updateAllPublishTimes() {
  console.log('🕐 开始更新文章发布时间...');
  console.log(`📂 文章目录: ${articlesDir}`);

  if (!fs.existsSync(articlesDir)) {
    console.error(`❌ 文章目录不存在: ${articlesDir}`);
    return;
  }

  const items = fs.readdirSync(articlesDir);
  const articleFiles = [];

  // 收集所有文章文件
  for (const item of items) {
    const fullPath = path.join(articlesDir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        articleFiles.push(mdxPath);
      }
    }
  }

  console.log(`📁 找到 ${articleFiles.length} 篇文章`);

  // 生成分布的时间
  const distributedTimes = generateDistributedTimes(articleFiles.length);

  let updatedCount = 0;

  // 更新每篇文章的发布时间
  for (let i = 0; i < articleFiles.length; i++) {
    const filePath = articleFiles[i];
    const newTime = distributedTimes[i];

    console.log(`🔧 更新: ${path.basename(path.dirname(filePath))} -> ${newTime.toLocaleString()}`);

    if (updatePublishTime(filePath, newTime)) {
      updatedCount++;
    }
  }

  console.log('\n📊 更新结果摘要:');
  console.log(`📁 总文章数: ${articleFiles.length}`);
  console.log(`✅ 成功更新: ${updatedCount}`);
  console.log(`❌ 更新失败: ${articleFiles.length - updatedCount}`);

  if (updatedCount > 0) {
    console.log('\n🎉 发布时间更新完成！');
    console.log('📅 文章发布时间已分布在2025年6月到现在');
    console.log('💡 现在可以访问网站查看更新后的发布时间');
  } else {
    console.log('\n📝 没有文章需要更新');
  }
}

updateAllPublishTimes(); 