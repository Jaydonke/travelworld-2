#!/usr/bin/env node

/**
 * 迁移到Blogsmith Pro模板脚本
 * 使用方案A：最小改动方案
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  blogsmithDir: path.join(__dirname, '../blogsmith-pro-v7.2.0'),
  targetDir: path.join(__dirname, '..'),
  scriptsDir: path.join(__dirname, '../scripts'),
  backupDir: path.join(__dirname, '../backups/migration-backup')
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建readline接口
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 询问用户确认
async function askConfirmation(question) {
  const rl = createReadlineInterface();
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 步骤1：备份重要文件
async function backupImportantFiles() {
  log('\n📦 步骤1：备份重要文件...', 'cyan');
  
  const filesToBackup = [
    'scripts',
    'src/content/articles',
    'src/assets/images/articles',
    'src/lib/config',
    'config.template.js',
    'newarticle',
    'author',
    'package.json'
  ];
  
  // 创建备份目录
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  for (const file of filesToBackup) {
    const srcPath = path.join(CONFIG.targetDir, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(CONFIG.backupDir, file);
      const destDir = path.dirname(destPath);
      
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // 复制文件或目录
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      
      log(`  ✅ 备份: ${file}`, 'green');
    }
  }
  
  log(`  💾 备份完成: ${CONFIG.backupDir}`, 'blue');
}

// 步骤2：复制blogsmith模板
async function copyBlogsmithTemplate() {
  log('\n📋 步骤2：复制Blogsmith模板...', 'cyan');
  
  if (!fs.existsSync(CONFIG.blogsmithDir)) {
    log(`  ❌ Blogsmith模板不存在: ${CONFIG.blogsmithDir}`, 'red');
    return false;
  }
  
  // 要复制的blogsmith文件和目录
  const itemsToCopy = [
    'src/components',
    'src/layouts',
    'src/pages',
    'src/styles',
    'src/icons',
    'src/js',
    'src/content/blog',  // 创建blog目录结构
    'src/content/authors',
    'src/content/otherPages',
    'src/config',
    'astro.config.mjs',
    'tailwind.config.mjs',
    'tsconfig.json',
    'starwind.config.json'
  ];
  
  for (const item of itemsToCopy) {
    const srcPath = path.join(CONFIG.blogsmithDir, item);
    const destPath = path.join(CONFIG.targetDir, item);
    
    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      
      log(`  ✅ 复制: ${item}`, 'green');
    }
  }
  
  return true;
}

// 步骤3：恢复脚本和配置
async function restoreScriptsAndConfig() {
  log('\n🔧 步骤3：恢复脚本和配置...', 'cyan');
  
  // 恢复scripts目录
  const backupScriptsDir = path.join(CONFIG.backupDir, 'scripts');
  if (fs.existsSync(backupScriptsDir)) {
    copyDirectory(backupScriptsDir, CONFIG.scriptsDir);
    log(`  ✅ 恢复scripts目录`, 'green');
  }
  
  // 恢复配置文件
  const configFiles = ['config.template.js'];
  for (const file of configFiles) {
    const backupPath = path.join(CONFIG.backupDir, file);
    if (fs.existsSync(backupPath)) {
      const destPath = path.join(CONFIG.targetDir, file);
      fs.copyFileSync(backupPath, destPath);
      log(`  ✅ 恢复: ${file}`, 'green');
    }
  }
  
  // 恢复author和newarticle目录
  const dirsToRestore = ['author', 'newarticle'];
  for (const dir of dirsToRestore) {
    const backupPath = path.join(CONFIG.backupDir, dir);
    if (fs.existsSync(backupPath)) {
      const destPath = path.join(CONFIG.targetDir, dir);
      copyDirectory(backupPath, destPath);
      log(`  ✅ 恢复: ${dir}`, 'green');
    }
  }
}

// 步骤4：创建软链接
async function createCompatibilityLinks() {
  log('\n🔗 步骤4：创建兼容性软链接...', 'cyan');
  
  const links = [
    {
      target: 'src\\data\\blog',
      link: 'src\\content\\articles',
      description: '文章目录映射'
    },
    {
      target: 'src\\data',
      link: 'src\\content',
      description: '内容目录映射'
    }
  ];
  
  for (const { target, link, description } of links) {
    const targetPath = path.join(CONFIG.targetDir, target);
    const linkPath = path.join(CONFIG.targetDir, link);
    
    // 确保目标目录存在
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // 如果链接已存在，先删除
    if (fs.existsSync(linkPath)) {
      if (fs.lstatSync(linkPath).isSymbolicLink()) {
        fs.unlinkSync(linkPath);
      }
    }
    
    if (process.platform === 'win32') {
      log(`  ⚠️  请手动创建软链接 (需要管理员权限):`, 'yellow');
      log(`     mklink /D "${linkPath}" "${targetPath}"`, 'blue');
      log(`     ${description}`, 'cyan');
    } else {
      try {
        fs.symlinkSync(targetPath, linkPath, 'dir');
        log(`  ✅ 创建软链接: ${description}`, 'green');
      } catch (error) {
        log(`  ❌ 创建软链接失败: ${error.message}`, 'red');
      }
    }
  }
}

// 步骤5：迁移文章内容
async function migrateArticles() {
  log('\n📚 步骤5：迁移文章内容...', 'cyan');
  
  const articlesBackup = path.join(CONFIG.backupDir, 'src/content/articles');
  const imagesBackup = path.join(CONFIG.backupDir, 'src/assets/images/articles');
  
  const targetArticlesDir = path.join(CONFIG.targetDir, 'src/content/blog');
  const targetImagesDir = path.join(CONFIG.targetDir, 'src/assets/images/articles');
  
  // 迁移文章
  if (fs.existsSync(articlesBackup)) {
    if (!fs.existsSync(targetArticlesDir)) {
      fs.mkdirSync(targetArticlesDir, { recursive: true });
    }
    copyDirectory(articlesBackup, targetArticlesDir);
    log(`  ✅ 迁移文章内容到: src/content/blog`, 'green');
  }
  
  // 迁移图片
  if (fs.existsSync(imagesBackup)) {
    if (!fs.existsSync(targetImagesDir)) {
      fs.mkdirSync(targetImagesDir, { recursive: true });
    }
    copyDirectory(imagesBackup, targetImagesDir);
    log(`  ✅ 迁移图片资源`, 'green');
  }
}

// 步骤6：合并package.json
async function mergePackageJson() {
  log('\n📦 步骤6：合并package.json...', 'cyan');
  
  const backupPackagePath = path.join(CONFIG.backupDir, 'package.json');
  const blogsmithPackagePath = path.join(CONFIG.blogsmithDir, 'package.json');
  const targetPackagePath = path.join(CONFIG.targetDir, 'package.json');
  
  if (fs.existsSync(backupPackagePath) && fs.existsSync(blogsmithPackagePath)) {
    const backupPackage = JSON.parse(fs.readFileSync(backupPackagePath, 'utf8'));
    const blogsmithPackage = JSON.parse(fs.readFileSync(blogsmithPackagePath, 'utf8'));
    
    // 保留原有的脚本命令
    const mergedScripts = {
      ...blogsmithPackage.scripts,
      ...backupPackage.scripts
    };
    
    // 合并依赖
    const mergedPackage = {
      ...blogsmithPackage,
      scripts: mergedScripts,
      dependencies: {
        ...blogsmithPackage.dependencies,
        ...backupPackage.dependencies
      },
      devDependencies: {
        ...blogsmithPackage.devDependencies,
        ...backupPackage.devDependencies
      }
    };
    
    fs.writeFileSync(targetPackagePath, JSON.stringify(mergedPackage, null, 2));
    log(`  ✅ 合并package.json完成`, 'green');
  }
}

// 复制目录
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 主函数
async function main() {
  log('\n🚀 Blogsmith Pro 模板迁移工具', 'bright');
  log('=' .repeat(50), 'cyan');
  log('使用方案A：最小改动方案', 'blue');
  log('保留所有脚本功能，通过软链接保持兼容', 'blue');
  log('=' .repeat(50), 'cyan');
  
  // 检查blogsmith模板是否存在
  if (!fs.existsSync(CONFIG.blogsmithDir)) {
    log('\n❌ 错误：找不到blogsmith-pro-v7.2.0目录', 'red');
    log('  请确保该目录存在于项目根目录', 'yellow');
    return;
  }
  
  // 用户确认
  const confirm = await askConfirmation('\n确定要开始迁移吗？(y/N): ');
  if (!confirm) {
    log('❌ 迁移已取消', 'yellow');
    return;
  }
  
  try {
    // 执行迁移步骤
    await backupImportantFiles();
    await copyBlogsmithTemplate();
    await restoreScriptsAndConfig();
    await createCompatibilityLinks();
    await migrateArticles();
    await mergePackageJson();
    
    log('\n' + '='.repeat(50), 'green');
    log('✅ 迁移完成！', 'bright');
    log('=' .repeat(50), 'green');
    
    log('\n📋 后续步骤：', 'cyan');
    log('  1. 如果是Windows系统，请以管理员身份运行以下命令创建软链接：', 'yellow');
    log('     cd src && mklink /D content data', 'blue');
    log('     cd content && mklink /D articles ..\\data\\blog', 'blue');
    log('\n  2. 安装依赖：', 'yellow');
    log('     npm install', 'blue');
    log('\n  3. 同步配置：', 'yellow');
    log('     npm run sync-config', 'blue');
    log('\n  4. 测试网站：', 'yellow');
    log('     npm run dev', 'blue');
    log('\n  5. 测试脚本功能：', 'yellow');
    log('     npm run add-articles-improved', 'blue');
    log('     npm run schedule-articles', 'blue');
    
    log('\n💾 备份位置：', 'cyan');
    log(`  ${CONFIG.backupDir}`, 'blue');
    
  } catch (error) {
    log(`\n❌ 迁移失败: ${error.message}`, 'red');
    console.error(error);
    log('\n💡 您可以从备份恢复：', 'yellow');
    log(`  ${CONFIG.backupDir}`, 'blue');
  }
}

// 运行迁移
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});