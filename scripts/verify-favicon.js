#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// 必需的favicon文件
const requiredFiles = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'site.webmanifest'
];

console.log('\n🔍 验证Favicon配置\n');
console.log('=' .repeat(60));

let allGood = true;

// 检查文件是否存在
console.log('检查favicon文件:');
console.log('-' .repeat(60));

requiredFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allGood = false;
  }
});

// 检查site.webmanifest内容
console.log('\n检查site.webmanifest配置:');
console.log('-' .repeat(60));

const manifestPath = path.join(publicDir, 'site.webmanifest');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`  名称: ${manifest.name || '(未设置)'}`);
    console.log(`  短名称: ${manifest.short_name || '(未设置)'}`);
    console.log(`  主题颜色: ${manifest.theme_color}`);
    console.log(`  背景颜色: ${manifest.background_color}`);
    console.log(`  图标数量: ${manifest.icons ? manifest.icons.length : 0}`);
    
    if (manifest.icons) {
      manifest.icons.forEach(icon => {
        console.log(`    - ${icon.src} (${icon.sizes})`);
      });
    }
  } catch (error) {
    console.log(`❌ 无法解析site.webmanifest: ${error.message}`);
    allGood = false;
  }
}

console.log('\n' + '=' .repeat(60));

if (allGood) {
  console.log('\n✅ Favicon配置完成！');
  console.log('\n下一步:');
  console.log('  1. 运行 npm run dev 查看效果');
  console.log('  2. 清除浏览器缓存 (Ctrl+Shift+R)');
  console.log('  3. 检查浏览器标签页图标是否更新');
} else {
  console.log('\n⚠️  有些文件缺失，请检查并修复');
}

console.log('\n💡 提示:');
console.log('  • Favicon可能需要清除浏览器缓存才能看到更新');
console.log('  • 某些浏览器可能缓存favicon较长时间');
console.log('  • 可以在隐身模式下查看最新效果');