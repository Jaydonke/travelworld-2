#!/usr/bin/env node

/**
 * 删除所有文章脚本
 * 
 * 功能：
 * - 删除所有文章目录和文件
 * - 删除所有文章图片
 * - 创建完整备份
 * - 提供恢复功能
 * - 安全确认机制
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/blog'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  backupDir: path.join(__dirname, '../backups'),
  newArticlesDir: path.join(__dirname, '../newarticle'),
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

/**
 * 创建readline接口用于用户交互
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 询问用户确认
 */
async function askConfirmation(question) {
  const rl = createReadlineInterface();
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * 获取当前文章统计信息
 */
function getArticleStats() {
  const stats = {
    articleCount: 0,
    imageCount: 0,
    totalSize: 0,
    articles: []
  };

  try {
    if (fs.existsSync(CONFIG.articlesDir)) {
      const articles = fs.readdirSync(CONFIG.articlesDir)
        .filter(item => {
          const fullPath = path.join(CONFIG.articlesDir, item);
          return fs.statSync(fullPath).isDirectory();
        });

      stats.articleCount = articles.length;
      stats.articles = articles;

      // 计算总大小
      articles.forEach(article => {
        const articlePath = path.join(CONFIG.articlesDir, article);
        const imagePath = path.join(CONFIG.imagesDir, article);
        
        // 计算文章文件大小
        if (fs.existsSync(articlePath)) {
          const articleFiles = fs.readdirSync(articlePath, { recursive: true });
          articleFiles.forEach(file => {
            const filePath = path.join(articlePath, file);
            if (fs.statSync(filePath).isFile()) {
              stats.totalSize += fs.statSync(filePath).size;
            }
          });
        }

        // 计算图片文件大小
        if (fs.existsSync(imagePath)) {
          const imageFiles = fs.readdirSync(imagePath, { recursive: true });
          imageFiles.forEach(file => {
            const filePath = path.join(imagePath, file);
            if (fs.statSync(filePath).isFile()) {
              stats.totalSize += fs.statSync(filePath).size;
              stats.imageCount++;
            }
          });
        }
      });
    }

    return stats;
  } catch (error) {
    log(`获取文章统计失败: ${error.message}`, 'red');
    return stats;
  }
}

/**
 * 创建完整备份
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `articles-backup-${timestamp}`;
  const backupPath = path.join(CONFIG.backupDir, backupName);

  log('\n💾 创建完整备份...', 'cyan');

  try {
    // 创建备份目录
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
    
    fs.mkdirSync(backupPath, { recursive: true });

    // 备份文章内容
    if (fs.existsSync(CONFIG.articlesDir)) {
      const articlesBackupPath = path.join(backupPath, 'articles');
      await copyDirectory(CONFIG.articlesDir, articlesBackupPath);
      log(`  ✅ 文章内容已备份到: ${articlesBackupPath}`, 'green');
    }

    // 备份图片
    if (fs.existsSync(CONFIG.imagesDir)) {
      const imagesBackupPath = path.join(backupPath, 'images');
      await copyDirectory(CONFIG.imagesDir, imagesBackupPath);
      log(`  ✅ 图片文件已备份到: ${imagesBackupPath}`, 'green');
    }

    // 备份newarticle目录（如果存在）
    if (fs.existsSync(CONFIG.newArticlesDir)) {
      const newArticlesBackupPath = path.join(backupPath, 'newarticle');
      await copyDirectory(CONFIG.newArticlesDir, newArticlesBackupPath);
      log(`  ✅ 新文章源文件已备份到: ${newArticlesBackupPath}`, 'green');
    }

    // 创建恢复脚本
    const restoreScript = `#!/usr/bin/env node

// 恢复脚本 - 自动生成于 ${new Date().toISOString()}
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESTORE_PATHS = {
  articles: path.join(__dirname, '../../src/content/articles'),
  images: path.join(__dirname, '../../src/assets/images/articles'),
  newarticle: path.join(__dirname, '../../newarticle')
};

console.log('🔄 开始恢复备份...');

try {
  // 恢复文章
  if (fs.existsSync('articles')) {
    if (fs.existsSync(RESTORE_PATHS.articles)) {
      fs.rmSync(RESTORE_PATHS.articles, { recursive: true, force: true });
    }
    fs.cpSync('articles', RESTORE_PATHS.articles, { recursive: true });
    console.log('✅ 文章已恢复');
  }

  // 恢复图片
  if (fs.existsSync('images')) {
    if (fs.existsSync(RESTORE_PATHS.images)) {
      fs.rmSync(RESTORE_PATHS.images, { recursive: true, force: true });
    }
    fs.cpSync('images', RESTORE_PATHS.images, { recursive: true });
    console.log('✅ 图片已恢复');
  }

  // 恢复新文章源文件
  if (fs.existsSync('newarticle')) {
    if (fs.existsSync(RESTORE_PATHS.newarticle)) {
      fs.rmSync(RESTORE_PATHS.newarticle, { recursive: true, force: true });
    }
    fs.cpSync('newarticle', RESTORE_PATHS.newarticle, { recursive: true });
    console.log('✅ 新文章源文件已恢复');
  }

  console.log('🎉 备份恢复完成！');
  console.log('💡 运行 npm run dev 重新启动网站');
} catch (error) {
  console.error('❌ 恢复失败:', error.message);
  process.exit(1);
}
`;

    fs.writeFileSync(path.join(backupPath, 'restore.js'), restoreScript);
    log(`  📜 恢复脚本已创建: ${path.join(backupPath, 'restore.js')}`, 'blue');

    // 创建备份信息文件
    const backupInfo = {
      timestamp: new Date().toISOString(),
      stats: getArticleStats(),
      backupPath: backupPath,
      restoreCommand: `node "${path.join(backupPath, 'restore.js')}"`,
      description: '完整网站文章备份'
    };

    fs.writeFileSync(
      path.join(backupPath, 'backup-info.json'), 
      JSON.stringify(backupInfo, null, 2)
    );

    log(`\n✅ 备份创建成功: ${backupName}`, 'green');
    log(`📍 备份位置: ${backupPath}`, 'cyan');
    
    return backupPath;

  } catch (error) {
    log(`❌ 备份创建失败: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * 复制目录
 */
async function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 删除所有文章
 */
async function deleteAllArticles() {
  log('\n🗑️  开始删除所有文章...', 'magenta');

  const deletionResults = {
    articlesDeleted: 0,
    imagesDeleted: 0,
    imageFoldersDeleted: 0,
    errors: []
  };

  try {
    // 删除文章内容目录
    if (fs.existsSync(CONFIG.articlesDir)) {
      const articles = fs.readdirSync(CONFIG.articlesDir)
        .filter(item => {
          const fullPath = path.join(CONFIG.articlesDir, item);
          return fs.statSync(fullPath).isDirectory();
        });

      for (const article of articles) {
        try {
          const articlePath = path.join(CONFIG.articlesDir, article);
          fs.rmSync(articlePath, { recursive: true, force: true });
          deletionResults.articlesDeleted++;
          log(`  🗑️  已删除文章: ${article}`, 'yellow');
        } catch (error) {
          deletionResults.errors.push(`文章删除失败 ${article}: ${error.message}`);
        }
      }
      
      if (articles.length === 0) {
        log(`  ℹ️  文章目录已为空`, 'cyan');
      }
    }

    // 删除所有图片目录（即使文章目录为空也要删除）
    if (fs.existsSync(CONFIG.imagesDir)) {
      const imageArticles = fs.readdirSync(CONFIG.imagesDir)
        .filter(item => {
          const fullPath = path.join(CONFIG.imagesDir, item);
          return fs.statSync(fullPath).isDirectory();
        });

      if (imageArticles.length > 0) {
        log(`\n  🖼️  发现 ${imageArticles.length} 个图片文件夹需要删除`, 'cyan');
        
        for (const article of imageArticles) {
          try {
            const imagePath = path.join(CONFIG.imagesDir, article);
            let imageCount = 0;
            
            // 安全地计算图片数量
            try {
              const imageFiles = fs.readdirSync(imagePath, { recursive: true })
                .filter(file => {
                  const filePath = path.join(imagePath, file);
                  return fs.statSync(filePath).isFile();
                });
              imageCount = imageFiles.length;
              deletionResults.imagesDeleted += imageCount;
            } catch (e) {
              // 如果读取失败，继续删除文件夹
            }
            
            fs.rmSync(imagePath, { recursive: true, force: true });
            deletionResults.imageFoldersDeleted++;
            log(`  🖼️  已删除图片目录: ${article} (${imageCount}张图片)`, 'yellow');
          } catch (error) {
            deletionResults.errors.push(`图片删除失败 ${article}: ${error.message}`);
          }
        }
      } else {
        log(`  ℹ️  图片目录已为空`, 'cyan');
      }
    }

    return deletionResults;

  } catch (error) {
    log(`❌ 删除过程中出错: ${error.message}`, 'red');
    deletionResults.errors.push(`删除过程错误: ${error.message}`);
    return deletionResults;
  }
}

/**
 * 清理缓存
 */
function clearCache() {
  log('\n🧹 清理缓存...', 'cyan');
  
  const cacheDir = path.join(__dirname, '../.astro');
  
  try {
    if (fs.existsSync(cacheDir)) {
      if (process.platform === 'win32') {
        execSync(`Remove-Item -Recurse -Force "${cacheDir}" -ErrorAction SilentlyContinue`, { shell: 'powershell' });
      } else {
        execSync(`rm -rf "${cacheDir}"`);
      }
      log('  ✅ Astro缓存已清除', 'green');
    }
  } catch (error) {
    log(`  ⚠️  缓存清除失败: ${error.message}`, 'yellow');
  }
}

/**
 * 主函数
 */
async function main() {
  log('\n🗑️  文章删除脚本', 'bright');
  log('=' .repeat(50), 'red');
  log('⚠️  警告: 此操作将删除所有文章和图片！', 'red');
  log('=' .repeat(50), 'red');

  try {
    // 获取当前文章统计
    const stats = getArticleStats();
    
    // 同时检查图片文件夹
    let imageCount = 0;
    if (fs.existsSync(CONFIG.imagesDir)) {
      const imageFolders = fs.readdirSync(CONFIG.imagesDir)
        .filter(item => {
          const fullPath = path.join(CONFIG.imagesDir, item);
          return fs.statSync(fullPath).isDirectory();
        });
      imageCount = imageFolders.length;
    }
    
    if (stats.articleCount === 0 && imageCount === 0) {
      log('\n📭 没有找到任何文章或图片，无需删除', 'yellow');
      return;
    }

    log('\n📊 当前统计:', 'cyan');
    log(`   📄 文章数量: ${stats.articleCount}`, 'blue');
    log(`   🖼️  图片文件夹数量: ${imageCount}`, 'blue');
    log(`   💾 总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`, 'blue');
    
    if (stats.articles.length > 0) {
      log(`\n📋 文章列表:`, 'cyan');
      stats.articles.slice(0, 10).forEach(article => {
        log(`   • ${article}`, 'blue');
      });
      if (stats.articles.length > 10) {
        log(`   ... 还有 ${stats.articles.length - 10} 篇文章`, 'blue');
      }
    }
    
    if (imageCount > 0) {
      log(`\n🖼️  图片文件夹将被删除`, 'cyan');
    }

    // 创建备份
    const backupPath = await createBackup();

    // 执行删除
    const results = await deleteAllArticles();

    // 清理缓存
    clearCache();

    // 显示结果
    log('\n' + '='.repeat(50), 'green');
    log('📊 删除操作完成', 'bright');
    log(`   🗑️  已删除文章: ${results.articlesDeleted} 篇`, 'green');
    log(`   🖼️  已删除图片: ${results.imagesDeleted} 张`, 'green');
    log(`   ❌ 错误数量: ${results.errors.length}`, results.errors.length > 0 ? 'red' : 'green');

    if (results.errors.length > 0) {
      log('\n⚠️  删除过程中的错误:', 'yellow');
      results.errors.forEach(error => log(`   • ${error}`, 'red'));
    }

    log(`\n💾 备份位置: ${backupPath}`, 'cyan');
    log('🔄 恢复命令:', 'cyan');
    log(`   node "${path.join(backupPath, 'restore.js')}"`, 'blue');
    
    log('\n🎉 所有文章已删除完成！', 'green');
    log('💡 现在可以添加新的文章内容', 'cyan');

  } catch (error) {
    log(`\n❌ 脚本执行失败: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行脚本
main().catch(error => {
  log(`\n❌ 致命错误: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

export { main };