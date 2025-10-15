#!/usr/bin/env node

/**
 * 更新所有作者信息脚本
 * 从 author/ 文件夹读取作者名字和头像，更新所有作者文件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  authorSourceDir: path.join(__dirname, '../author'),
  authorsContentDir: path.join(__dirname, '../src/content/authors'),
  authorsImagesDir: path.join(__dirname, '../src/assets/images/authors'),
  nameFile: 'name.txt',
  avatarFile: 'Screenshot 2025-08-11 105116.png'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 不同的职位头衔列表
const jobTitles = [
  'AI Solutions Architect',
  'Product Innovation Lead',
  'Digital Transformation Expert',
  'Tech Strategy Consultant',
  'AI Implementation Specialist',
  'Innovation Program Manager',
  'AI Product Manager',
  'Technology Evangelist',
  'Digital Solutions Expert',
  'AI Strategy Advisor'
];

// 不同的个人简介
const bios = [
  'Expert in AI-powered solutions and digital transformation with a passion for innovative technology.',
  'Specializing in artificial intelligence implementation and strategic technology consulting.',
  'Dedicated to helping businesses leverage AI for competitive advantage and operational excellence.',
  'Passionate about bridging the gap between cutting-edge AI technology and practical business applications.',
  'Focused on delivering innovative AI solutions that drive measurable business outcomes.',
  'Committed to democratizing AI technology and making it accessible for businesses of all sizes.',
  'Expert in developing and implementing AI strategies that align with business objectives.',
  'Helping organizations navigate the AI revolution with practical, actionable insights.',
  'Specializing in AI integration and digital innovation for modern enterprises.',
  'Driving business transformation through intelligent automation and AI-powered solutions.'
];

// 社交媒体配置
const socialProfiles = [
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/brianmitchell',
    icon: 'linkedin-icon.svg'
  },
  {
    name: 'Twitter',
    url: 'https://twitter.com/brianmitchell',
    icon: 'twitter-icon.svg'
  }
];

async function readAuthorName() {
  const nameFilePath = path.join(CONFIG.authorSourceDir, CONFIG.nameFile);
  
  if (!fs.existsSync(nameFilePath)) {
    throw new Error(`名字文件不存在: ${nameFilePath}`);
  }
  
  const name = fs.readFileSync(nameFilePath, 'utf8').trim();
  
  // 格式化名字（首字母大写）
  const formattedName = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return formattedName;
}

async function copyAvatar(authorSlug) {
  const sourceAvatarPath = path.join(CONFIG.authorSourceDir, CONFIG.avatarFile);
  const targetAvatarDir = path.join(CONFIG.authorsImagesDir, authorSlug);
  const targetAvatarPath = path.join(targetAvatarDir, 'avatar.jpg');
  
  if (!fs.existsSync(sourceAvatarPath)) {
    log(`⚠️  头像文件不存在: ${CONFIG.avatarFile}`, 'yellow');
    return false;
  }
  
  // 确保目标目录存在
  if (!fs.existsSync(targetAvatarDir)) {
    fs.mkdirSync(targetAvatarDir, { recursive: true });
  }
  
  // 复制头像文件
  fs.copyFileSync(sourceAvatarPath, targetAvatarPath);
  log(`  ✅ 头像已更新: ${authorSlug}`, 'green');
  
  return true;
}

async function updateAuthorFile(authorSlug, authorName, index) {
  const authorFilePath = path.join(CONFIG.authorsContentDir, authorSlug, 'index.mdx');
  
  if (!fs.existsSync(authorFilePath)) {
    log(`  ⏭️  跳过不存在的作者: ${authorSlug}`, 'yellow');
    return;
  }
  
  // 为每个作者分配不同的职位和简介
  const jobTitle = jobTitles[index % jobTitles.length];
  const bio = bios[index % bios.length];
  
  // 创建新的作者内容
  const newContent = `---
name: ${authorName}
job: ${jobTitle}
avatar: '@assets/images/authors/${authorSlug}/avatar.jpg'
bio: ${bio}
social:
${socialProfiles.map(profile => `  - name: ${profile.name}
    url: ${profile.url}
    icon: ${profile.icon}`).join('\n')}
---
`;
  
  // 备份原文件
  const backupPath = `${authorFilePath}.backup.${Date.now()}`;
  fs.copyFileSync(authorFilePath, backupPath);
  
  // 写入新内容
  fs.writeFileSync(authorFilePath, newContent);
  
  log(`  ✅ 作者信息已更新: ${authorSlug}`, 'green');
  log(`     职位: ${jobTitle}`, 'cyan');
}

async function main() {
  log('🔄 开始更新所有作者信息', 'cyan');
  log(`📂 源文件夹: ${CONFIG.authorSourceDir}`, 'blue');
  log(`📂 作者内容文件夹: ${CONFIG.authorsContentDir}`, 'blue');
  
  try {
    // 读取新的作者名字
    const authorName = await readAuthorName();
    log(`\n👤 新作者名字: ${authorName}`, 'magenta');
    
    // 获取所有作者文件夹
    const authorDirs = fs.readdirSync(CONFIG.authorsContentDir)
      .filter(file => {
        const fullPath = path.join(CONFIG.authorsContentDir, file);
        return fs.statSync(fullPath).isDirectory();
      });
    
    log(`\n📊 找到 ${authorDirs.length} 个作者文件夹`, 'blue');
    
    // 更新每个作者
    for (let i = 0; i < authorDirs.length; i++) {
      const authorSlug = authorDirs[i];
      log(`\n📝 处理作者: ${authorSlug}`, 'cyan');
      
      // 更新作者文件
      await updateAuthorFile(authorSlug, authorName, i);
      
      // 复制头像
      await copyAvatar(authorSlug);
    }
    
    log('\n🎉 所有作者信息更新完成！', 'green');
    log('\n💡 提示：', 'yellow');
    log('   1. 所有作者名字已更新为: ' + authorName, 'yellow');
    log('   2. 每个作者分配了不同的职位头衔', 'yellow');
    log('   3. 头像已从 author/ 文件夹复制到对应位置', 'yellow');
    log('   4. 原文件已备份，以 .backup.时间戳 结尾', 'yellow');
    
  } catch (error) {
    log(`\n❌ 错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

main().catch(console.error);