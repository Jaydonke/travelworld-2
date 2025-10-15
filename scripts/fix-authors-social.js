#!/usr/bin/env node

/**
 * 修复作者social字段格式
 * 将数组格式转换为对象格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsDir = path.join(__dirname, '../src/content/authors');

// 获取所有作者目录
const authorDirs = fs.readdirSync(authorsDir).filter(dir => {
  const fullPath = path.join(authorsDir, dir);
  return fs.statSync(fullPath).isDirectory();
});

console.log(`Found ${authorDirs.length} author directories to fix`);

authorDirs.forEach(authorDir => {
  const indexPath = path.join(authorsDir, authorDir, 'index.mdx');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`Skipping ${authorDir} - no index.mdx file`);
    return;
  }
  
  let content = fs.readFileSync(indexPath, 'utf-8');
  
  // 检查是否有social字段并且是数组格式
  if (content.includes('social:\n  - name:')) {
    console.log(`Fixing ${authorDir}...`);
    
    // 提取social数组
    const socialMatch = content.match(/social:\s*\n((?:\s+-[^\n]+\n)+)/);
    
    if (socialMatch) {
      const socialArray = socialMatch[1];
      
      // 解析数组项
      let twitter = '';
      let linkedin = '';
      
      // 查找LinkedIn
      const linkedinMatch = socialArray.match(/url:\s*(https:\/\/linkedin\.com[^\n]+)/);
      if (linkedinMatch) {
        linkedin = linkedinMatch[1].trim();
      }
      
      // 查找Twitter
      const twitterMatch = socialArray.match(/url:\s*(https:\/\/twitter\.com[^\n]+)/);
      if (twitterMatch) {
        twitter = twitterMatch[1].trim();
      }
      
      // 构建新的social对象
      let newSocial = 'social:';
      if (linkedin) {
        newSocial += `\n  linkedin: ${linkedin}`;
      }
      if (twitter) {
        newSocial += `\n  twitter: ${twitter}`;
      }
      
      // 如果没有任何社交链接，就移除social字段
      if (newSocial === 'social:') {
        // 移除整个social部分
        content = content.replace(/social:\s*\n((?:\s+-[^\n]+\n)+)/, '');
      } else {
        // 替换为新格式
        content = content.replace(/social:\s*\n((?:\s+-[^\n]+\n)+)/, newSocial + '\n');
      }
      
      // 写回文件
      fs.writeFileSync(indexPath, content);
      console.log(`✅ Fixed ${authorDir}`);
    }
  } else {
    console.log(`Skipping ${authorDir} - already in correct format or no social field`);
  }
});

console.log('Done!');