#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '../src/assets/images/articles');

// 创建一个有效的PNG占位图片
function createValidPlaceholderImage(targetPath) {
  // 这是一个1x1像素的透明PNG图片的base64编码
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  const pngBuffer = Buffer.from(pngBase64, 'base64');
  fs.writeFileSync(targetPath, pngBuffer);
}

// 检查图片文件是否有效
function isValidImageFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    // 检查PNG文件头
    if (buffer.length >= 8 && 
        buffer[0] === 0x89 && buffer[1] === 0x50 && 
        buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && 
        buffer[6] === 0x1A && buffer[7] === 0x0A) {
      return true;
    }
    // 检查JPEG文件头
    if (buffer.length >= 2 && 
        buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// 清理损坏的图片文件
function cleanCorruptedImages() {
  console.log('🚀 清理损坏图片脚本启动');
  console.log(`🖼️ 图片目录: ${imagesDir}`);

  if (!fs.existsSync(imagesDir)) {
    console.log('📝 图片目录不存在，无需清理');
    return;
  }

  const items = fs.readdirSync(imagesDir);
  let totalCleaned = 0;
  let totalRecreated = 0;

  for (const item of items) {
    const imagePath = path.join(imagesDir, item);
    const stat = fs.statSync(imagePath);

    if (stat.isDirectory()) {
      console.log(`📁 检查目录: ${item}`);
      const imageFiles = fs.readdirSync(imagePath);
      
      for (const imageFile of imageFiles) {
        const fullImagePath = path.join(imagePath, imageFile);
        
        if (!isValidImageFile(fullImagePath)) {
          console.log(`❌ 发现损坏图片: ${imageFile}`);
          
          // 删除损坏的文件
          fs.unlinkSync(fullImagePath);
          console.log(`🗑️ 已删除: ${imageFile}`);
          totalCleaned++;
          
          // 重新创建有效的占位图片
          createValidPlaceholderImage(fullImagePath);
          console.log(`✅ 已重新创建: ${imageFile}`);
          totalRecreated++;
        }
      }
    }
  }

  console.log('\n📊 清理结果摘要:');
  console.log(`🗑️ 删除的损坏文件: ${totalCleaned}`);
  console.log(`✅ 重新创建的文件: ${totalRecreated}`);

  if (totalCleaned > 0) {
    console.log('\n🎉 损坏图片清理完成！');
    console.log('💡 所有损坏的图片文件已替换为有效的占位图片');
  } else {
    console.log('\n📝 没有发现损坏的图片文件');
  }
}

cleanCorruptedImages(); 