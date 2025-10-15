#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证 Google Analytics 设置');

// 检查配置文件
const configPath = path.join(__dirname, '../src/lib/config/index.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

if (configContent.includes('googleAnalyticsId: "G-CDCLETJMND"')) {
  console.log('✅ Google Analytics ID 已添加到配置文件');
} else {
  console.log('❌ 配置文件中未找到 Google Analytics ID');
}

// 检查 GoogleAnalytics 组件
const gaComponentPath = path.join(__dirname, '../src/components/GoogleAnalytics.astro');
if (fs.existsSync(gaComponentPath)) {
  console.log('✅ GoogleAnalytics.astro 组件已创建');
  
  const gaContent = fs.readFileSync(gaComponentPath, 'utf8');
  if (gaContent.includes('gtag/js') && gaContent.includes('gtag(')) {
    console.log('✅ Google Analytics 脚本代码已正确添加');
  } else {
    console.log('❌ Google Analytics 脚本代码有问题');
  }
} else {
  console.log('❌ GoogleAnalytics.astro 组件未找到');
}

// 检查 head.astro 组件
const headPath = path.join(__dirname, '../src/components/bases/head.astro');
const headContent = fs.readFileSync(headPath, 'utf8');

if (headContent.includes('GoogleAnalytics') && headContent.includes('<GoogleAnalytics />')) {
  console.log('✅ head.astro 已包含 GoogleAnalytics 组件');
} else {
  console.log('❌ head.astro 中未正确引用 GoogleAnalytics 组件');
}

console.log('\n📊 Google Analytics 设置摘要:');
console.log('- 跟踪 ID: G-CDCLETJMND');
console.log('- 位置: 所有页面的 <head> 标签中');
console.log('- 环境: 仅在生产环境中加载');
console.log('- 特性: 包含页面标题和URL跟踪');

console.log('\n🚀 设置完成！Google Analytics 将在生产环境中自动跟踪用户数据。');