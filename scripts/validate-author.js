#!/usr/bin/env node

/**
 * 作者验证和管理工具
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  authorsDir: path.join(__dirname, '../src/content/authors'),
  authorAssetsDir: path.join(__dirname, '../src/assets/images/authors'),
  authorSourceDir: path.join(__dirname, '../author'),
  nameFile: 'name.txt'
};

/**
 * 获取所有可用的作者列表
 */
export function getAvailableAuthors() {
  try {
    if (!fs.existsSync(CONFIG.authorsDir)) {
      return [];
    }

    const authorDirs = fs.readdirSync(CONFIG.authorsDir);
    const authors = [];

    for (const dir of authorDirs) {
      const mdxPath = path.join(CONFIG.authorsDir, dir, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        try {
          const content = fs.readFileSync(mdxPath, 'utf8');
          const nameMatch = content.match(/name:\s*(.+)/);
          const jobMatch = content.match(/job:\s*(.+)/);
          
          authors.push({
            id: dir,
            name: nameMatch ? nameMatch[1].trim() : dir,
            job: jobMatch ? jobMatch[1].trim() : 'Unknown',
            hasAvatar: fs.existsSync(path.join(CONFIG.authorAssetsDir, dir, 'avatar.jpg'))
          });
        } catch (error) {
          console.warn(`无法读取作者信息: ${dir}`);
        }
      }
    }

    return authors.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn('获取作者列表失败:', error.message);
    return [];
  }
}

/**
 * 验证作者是否存在
 */
export function validateAuthor(authorId) {
  if (!authorId) return false;
  
  const authorPath = path.join(CONFIG.authorsDir, authorId, 'index.mdx');
  return fs.existsSync(authorPath);
}

/**
 * 从配置文件读取作者名并转换为ID格式
 */
export function readAndValidateAuthor() {
  try {
    const nameFilePath = path.join(CONFIG.authorSourceDir, CONFIG.nameFile);
    
    if (!fs.existsSync(nameFilePath)) {
      console.warn(`⚠️  作者配置文件不存在: ${nameFilePath}`);
      return getFallbackAuthor();
    }

    const name = fs.readFileSync(nameFilePath, 'utf8').trim();
    if (!name) {
      console.warn('⚠️  作者配置文件为空');
      return getFallbackAuthor();
    }

    // 检查是否设置为随机作者
    if (name.toLowerCase() === 'random') {
      return getRandomAuthor();
    }

    // 格式化名字: "Brian Mitchell" -> "brian-mitchell"
    const formattedName = name.split(' ')
      .map(word => word.toLowerCase())
      .join('-');

    // 验证作者是否存在
    if (validateAuthor(formattedName)) {
      console.log(`✅ 验证作者: ${name} -> ${formattedName}`);
      return formattedName;
    } else {
      console.warn(`⚠️  作者 "${formattedName}" 在系统中不存在`);
      return getFallbackAuthor();
    }

  } catch (error) {
    console.warn(`❌ 读取作者配置失败: ${error.message}`);
    return getFallbackAuthor();
  }
}

/**
 * 获取随机作者
 */
function getRandomAuthor() {
  const authors = getAvailableAuthors();
  
  if (authors.length === 0) {
    console.error('❌ 系统中没有可用的作者');
    throw new Error('No authors available. Please create at least one author.');
  }

  // 随机选择一个作者
  const randomIndex = Math.floor(Math.random() * authors.length);
  const randomAuthor = authors[randomIndex];
  
  console.log(`🎲 随机选择作者: ${randomAuthor.name} (${randomAuthor.id})`);
  return randomAuthor.id;
}

/**
 * 获取备用作者（使用第一个可用的作者）
 */
function getFallbackAuthor() {
  const authors = getAvailableAuthors();
  
  if (authors.length === 0) {
    console.error('❌ 系统中没有可用的作者');
    throw new Error('No authors available. Please create at least one author.');
  }

  const fallbackAuthor = authors[0];
  console.log(`🔄 使用备用作者: ${fallbackAuthor.name} (${fallbackAuthor.id})`);
  return fallbackAuthor.id;
}

/**
 * 创建新作者（如果不存在）
 */
export function createAuthorIfNotExists(name, authorId = null) {
  if (!name || typeof name !== 'string') {
    throw new Error('作者名称不能为空');
  }

  // 生成作者ID
  const id = authorId || name.split(' ')
    .map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .join('-');

  // 检查是否已存在
  if (validateAuthor(id)) {
    console.log(`✅ 作者已存在: ${name} (${id})`);
    return id;
  }

  try {
    // 创建作者目录
    const authorDir = path.join(CONFIG.authorsDir, id);
    const authorAssetsDir = path.join(CONFIG.authorAssetsDir, id);
    
    fs.mkdirSync(authorDir, { recursive: true });
    fs.mkdirSync(authorAssetsDir, { recursive: true });

    // 创建作者MDX文件
    const authorContent = `---
name: ${name}
job: Content Creator
avatar: '@assets/images/authors/${id}/avatar.jpg'
bio: An experienced writer focused on delivering high-quality, engaging content.
social:
  - name: LinkedIn
    url: https://linkedin.com/in/${id}
    icon: linkedin-icon.svg
  - name: Twitter
    url: https://twitter.com/${id}
    icon: twitter-icon.svg
---
`;

    fs.writeFileSync(path.join(authorDir, 'index.mdx'), authorContent);

    // 复制默认头像（如果有其他作者的头像）
    const authors = getAvailableAuthors();
    if (authors.length > 0) {
      const sourceAvatar = path.join(CONFIG.authorAssetsDir, authors[0].id, 'avatar.jpg');
      const targetAvatar = path.join(authorAssetsDir, 'avatar.jpg');
      
      if (fs.existsSync(sourceAvatar)) {
        fs.copyFileSync(sourceAvatar, targetAvatar);
      } else {
        // 创建占位符头像
        createPlaceholderAvatar(targetAvatar);
      }
    } else {
      createPlaceholderAvatar(path.join(authorAssetsDir, 'avatar.jpg'));
    }

    console.log(`✅ 成功创建作者: ${name} (${id})`);
    return id;

  } catch (error) {
    console.error(`❌ 创建作者失败: ${error.message}`);
    throw error;
  }
}

/**
 * 创建占位符头像
 */
function createPlaceholderAvatar(avatarPath) {
  // 创建一个简单的占位符图片（1x1像素透明PNG）
  const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');
  fs.writeFileSync(avatarPath, placeholderBuffer);
}

/**
 * 显示所有可用作者
 */
export function listAuthors() {
  const authors = getAvailableAuthors();
  
  console.log('\n📋 可用作者列表:');
  console.log('='.repeat(50));
  
  if (authors.length === 0) {
    console.log('❌ 没有找到任何作者');
    return;
  }

  authors.forEach((author, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${author.name}`);
    console.log(`    📁 ID: ${author.id}`);
    console.log(`    💼 职位: ${author.job}`);
    console.log(`    🖼️  头像: ${author.hasAvatar ? '✅' : '❌'}`);
    console.log('');
  });
  
  console.log('='.repeat(50));
}

// 如果直接运行此脚本，显示作者列表
if (process.argv[1] && process.argv[1].endsWith('validate-author.js')) {
  listAuthors();
}