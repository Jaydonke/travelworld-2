#!/usr/bin/env node

/**
 * 路径映射器 - 用于兼容不同的项目结构
 * 支持当前结构和blogsmith-pro结构
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测是否使用blogsmith结构
const isBlogsmithStructure = () => {
  const blogsmithPath = path.join(__dirname, '../src/content/blog');
  const currentPath = path.join(__dirname, '../src/content/articles');
  
  // 如果存在blog目录，则使用blogsmith结构
  if (fs.existsSync(blogsmithPath)) {
    return true;
  }
  
  // 如果只存在articles目录，使用当前结构
  if (fs.existsSync(currentPath)) {
    return false;
  }
  
  // 默认使用当前结构
  return false;
};

// 路径映射配置
export const PATH_MAP = {
  // 文章目录
  articlesDir: isBlogsmithStructure() 
    ? path.join(__dirname, '../src/content/blog')
    : path.join(__dirname, '../src/content/articles'),
    
  // 图片目录
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  
  // 新文章源目录
  newArticlesDir: path.join(__dirname, '../newarticle'),
  
  // 作者配置目录
  authorSourceDir: path.join(__dirname, '../author'),
  
  // 处理器路径
  handlersPath: isBlogsmithStructure()
    ? path.join(__dirname, '../src/lib')
    : path.join(__dirname, '../src/lib/handlers'),
    
  // 配置文件路径
  configPath: path.join(__dirname, '../src/lib/config/index.ts'),
  
  // 公共资源目录
  publicDir: path.join(__dirname, '../public'),
  
  // 备份目录
  backupDir: path.join(__dirname, '../backups'),
  
  // 缓存目录
  cacheDir: path.join(__dirname, '../.astro')
};

// 创建必要的目录
export function ensureDirectories() {
  const dirs = [
    PATH_MAP.articlesDir,
    PATH_MAP.imagesDir,
    PATH_MAP.newArticlesDir,
    PATH_MAP.authorSourceDir,
    PATH_MAP.backupDir
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    }
  });
}

// 创建软链接
export function createSymlinks() {
  const symlinks = [
    {
      target: path.join(__dirname, '../src/content/blog'),
      link: path.join(__dirname, '../src/content/articles'),
      type: 'dir'
    },
    {
      target: path.join(__dirname, '../src/content'),
      link: path.join(__dirname, '../src/content'),
      type: 'dir'
    }
  ];
  
  symlinks.forEach(({ target, link, type }) => {
    try {
      // 检查链接是否已存在
      if (fs.existsSync(link)) {
        const stats = fs.lstatSync(link);
        if (stats.isSymbolicLink()) {
          console.log(`ℹ️  软链接已存在: ${link}`);
          return;
        }
      }
      
      // 确保目标目录存在
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      
      // 创建软链接
      if (process.platform === 'win32') {
        // Windows需要管理员权限
        console.log(`⚠️  Windows系统需要管理员权限创建软链接`);
        console.log(`   请手动执行: mklink /D "${link}" "${target}"`);
      } else {
        fs.symlinkSync(target, link, type);
        console.log(`✅ 创建软链接: ${link} -> ${target}`);
      }
    } catch (error) {
      console.error(`❌ 创建软链接失败: ${error.message}`);
    }
  });
}

// 检查路径兼容性
export function checkCompatibility() {
  console.log('\n🔍 检查路径兼容性...\n');
  
  const checks = [
    {
      name: '文章目录',
      path: PATH_MAP.articlesDir,
      required: true
    },
    {
      name: '图片目录',
      path: PATH_MAP.imagesDir,
      required: true
    },
    {
      name: '配置文件',
      path: PATH_MAP.configPath,
      required: false
    },
    {
      name: '新文章目录',
      path: PATH_MAP.newArticlesDir,
      required: false
    }
  ];
  
  let allGood = true;
  
  checks.forEach(({ name, path, required }) => {
    const exists = fs.existsSync(path);
    const status = exists ? '✅' : (required ? '❌' : '⚠️');
    console.log(`${status} ${name}: ${path}`);
    
    if (required && !exists) {
      allGood = false;
    }
  });
  
  console.log('\n' + (allGood ? '✅ 所有必要路径都已就绪' : '❌ 某些必要路径缺失'));
  
  return allGood;
}

// 获取当前使用的结构类型
export function getStructureType() {
  return isBlogsmithStructure() ? 'blogsmith-pro' : 'current';
}

// 导出给其他脚本使用
export default PATH_MAP;

// 如果直接运行此脚本，执行检查
if (import.meta.url === `file://${__filename}`) {
  console.log('📋 路径映射器状态报告');
  console.log('========================\n');
  console.log(`结构类型: ${getStructureType()}`);
  
  checkCompatibility();
  
  console.log('\n💡 提示：');
  console.log('   - 使用 PATH_MAP 来获取正确的路径');
  console.log('   - 运行 ensureDirectories() 创建必要目录');
  console.log('   - 运行 createSymlinks() 创建软链接');
}