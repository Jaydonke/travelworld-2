#!/usr/bin/env node

/**
 * 批量修复所有作者的social字段格式
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsDir = path.join(__dirname, '../src/content/authors');

// 预定义的作者数据
const authorsData = {
  'alexandra-chen': {
    linkedin: 'https://linkedin.com/in/alexandrachen',
    twitter: 'https://twitter.com/alexandra_ai'
  },
  'benjamin-cole': {
    linkedin: 'https://linkedin.com/in/benjamincole',
    twitter: 'https://twitter.com/benjamincole'
  },
  'brian-mitchell': {
    linkedin: 'https://linkedin.com/in/brianmitchell',
    twitter: 'https://twitter.com/brianmitchell'
  },
  'daniel-foster': {
    linkedin: 'https://linkedin.com/in/danielfoster',
    twitter: 'https://twitter.com/danielfoster'
  },
  'emily-roberts': {
    linkedin: 'https://linkedin.com/in/emilyroberts-data',
    twitter: 'https://twitter.com/emily_data_sci'
  },
  'ethan-brooks': {
    linkedin: 'https://linkedin.com/in/ethanbrooks',
    twitter: 'https://twitter.com/ethanbrooks'
  },
  'gregory-shaw': {
    linkedin: 'https://linkedin.com/in/gregoryshaw',
    twitter: 'https://twitter.com/gregoryshaw'
  },
  'joshua-reynolds': {
    linkedin: 'https://linkedin.com/in/joshuareynolds',
    twitter: 'https://twitter.com/joshuareynolds'
  },
  'kevin-mitchell': {
    linkedin: 'https://linkedin.com/in/kevinmitchell',
    twitter: 'https://twitter.com/kevinmitchell'
  },
  'laura-stevens': {
    linkedin: 'https://linkedin.com/in/laurastevens',
    twitter: 'https://twitter.com/laurastevens'
  },
  'mark-patterson': {
    linkedin: 'https://linkedin.com/in/markpatterson',
    twitter: 'https://twitter.com/markpatterson'
  },
  'megan-turner': {
    linkedin: 'https://linkedin.com/in/meganturner',
    twitter: 'https://twitter.com/meganturner'
  },
  'natalie-hayes': {
    linkedin: 'https://linkedin.com/in/nataliehayes',
    twitter: 'https://twitter.com/nataliehayes'
  },
  'olivia-martinez': {
    linkedin: 'https://linkedin.com/in/oliviamartinez',
    twitter: 'https://twitter.com/oliviamartinez'
  },
  'priya-sharma': {
    linkedin: 'https://linkedin.com/in/priyasharma',
    twitter: 'https://twitter.com/priyasharma'
  },
  'rachel-foster': {
    linkedin: 'https://linkedin.com/in/rachelfoster',
    twitter: 'https://twitter.com/rachelfoster'
  }
};

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
  
  // 提取frontmatter部分
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    console.log(`Skipping ${authorDir} - no valid frontmatter`);
    return;
  }
  
  // 获取name, job, bio, avatar字段
  const nameMatch = content.match(/name:\s*(.+)/);
  const jobMatch = content.match(/job:\s*(.+)/);
  const bioMatch = content.match(/bio:\s*(.+)/);
  const avatarMatch = content.match(/avatar:\s*(.+)/);
  
  if (!nameMatch) {
    console.log(`Skipping ${authorDir} - no name field`);
    return;
  }
  
  // 构建新的frontmatter
  let newFrontmatter = '---\n';
  newFrontmatter += `name: ${nameMatch[1]}\n`;
  if (jobMatch) newFrontmatter += `job: ${jobMatch[1]}\n`;
  if (avatarMatch) newFrontmatter += `avatar: ${avatarMatch[1]}\n`;
  if (bioMatch) newFrontmatter += `bio: ${bioMatch[1]}\n`;
  
  // 添加social字段（如果有对应的数据）
  const socialData = authorsData[authorDir];
  if (socialData) {
    newFrontmatter += 'social:\n';
    if (socialData.linkedin) {
      newFrontmatter += `  linkedin: ${socialData.linkedin}\n`;
    }
    if (socialData.twitter) {
      newFrontmatter += `  twitter: ${socialData.twitter}\n`;
    }
  }
  
  newFrontmatter += '---\n';
  
  // 写回文件
  fs.writeFileSync(indexPath, newFrontmatter);
  console.log(`✅ Fixed ${authorDir}`);
});

console.log('Done!');