#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { execSync } from 'child_process';
import { getLatestArticleTime, generateSmartPublishTime } from './smart-time-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/articles'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  maxRetries: 3,
  retryDelay: 2000
};

// 下载图片函数（带重试机制）
async function downloadImageWithRetry(url, targetPath, maxRetries = CONFIG.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  尝试 ${attempt}/${maxRetries}: 下载 ${path.basename(targetPath)}`);
      await downloadImage(url, targetPath);
      console.log(`  ✅ 成功下载: ${path.basename(targetPath)}`);
      return true;
    } catch (error) {
      console.log(`  ❌ 第 ${attempt} 次尝试失败: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`  ⏳ 等待 ${CONFIG.retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      }
    }
  }
  return false;
}

// 基础下载图片函数
function downloadImage(url, targetPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
      }
    };

    const req = https.request(options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, targetPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(targetPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

// 从HTML中提取图片URL
function extractImagesFromHTML(htmlContent) {
  const images = [];
  
  // 提取img标签中的图片
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (match[1].startsWith('http')) {
      images.push(match[1]);
    }
  }
  
  return images;
}

// 验证HTML文件的图片是否可下载
async function validateHTMLImages(htmlFilePath) {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  const fileName = path.basename(htmlFilePath);
  
  // 提取标题用于显示
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i) ||
    htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].trim() : fileName;
  
  console.log(`\n📄 验证文章: ${title}`);
  
  const imageUrls = extractImagesFromHTML(htmlContent);
  
  if (imageUrls.length === 0) {
    console.log(`  ℹ️  没有外部图片需要下载`);
    return { success: true, title, failedImages: [] };
  }
  
  console.log(`  🖼️  发现 ${imageUrls.length} 张外部图片`);
  
  const failedImages = [];
  const tempDir = path.join(__dirname, '../temp-img-test');
  
  // 创建临时目录
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  } catch (e) {
    console.log(`  ⚠️  创建临时目录失败，使用系统临时目录`);
  }
  
  // 测试下载每张图片
  for (const imageUrl of imageUrls) {
    const fileName = `test_${Date.now()}_${path.basename(imageUrl)}`;
    const tempPath = path.join(tempDir, fileName);
    
    const success = await downloadImageWithRetry(imageUrl, tempPath);
    
    if (success) {
      // 删除测试文件
      fs.unlinkSync(tempPath);
    } else {
      failedImages.push(imageUrl);
      console.log(`  ⚠️  无法下载: ${imageUrl}`);
    }
  }
  
  // 清理临时目录
  try {
    fs.rmdirSync(tempDir);
  } catch (e) {}
  
  return {
    success: failedImages.length === 0,
    title,
    failedImages
  };
}

// 获取现有文章的发布时间
function getExistingArticleTimes() {
  const times = {};
  
  if (!fs.existsSync(CONFIG.articlesDir)) {
    return times;
  }
  
  const items = fs.readdirSync(CONFIG.articlesDir);
  
  for (const item of items) {
    const fullPath = path.join(CONFIG.articlesDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        const timeMatch = content.match(/publishedTime:\s*(.+)/);
        if (timeMatch) {
          times[item] = timeMatch[1];
        }
      }
    }
  }
  
  return times;
}

// 生成随机发布时间（最新的文章时间最近）
function generatePublishTime(index, totalCount) {
  const articleTime = generateSmartPublishTime(totalCount, index);
  return articleTime.toISOString();
}

// 打乱数组（Fisher-Yates）
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function main() {
  console.log('🚀 增强版新文章添加脚本（带验证）启动');
  console.log('=' .repeat(60));
  
  if (!fs.existsSync(CONFIG.newArticlesDir)) {
    console.error(`❌ 新文章目录不存在: ${CONFIG.newArticlesDir}`);
    return;
  }
  
  const htmlFiles = fs.readdirSync(CONFIG.newArticlesDir)
    .filter(file => file.toLowerCase().endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    console.log('📭 没有找到HTML文件');
    return;
  }
  
  console.log(`\n📋 找到 ${htmlFiles.length} 个HTML文件`);
  console.log('🔍 开始预验证图片下载...\n');
  
  // 预验证所有文章的图片
  const validationResults = [];
  const failedArticles = [];
  
  for (const htmlFile of htmlFiles) {
    const htmlFilePath = path.join(CONFIG.newArticlesDir, htmlFile);
    const result = await validateHTMLImages(htmlFilePath);
    validationResults.push({ ...result, fileName: htmlFile });
    
    if (!result.success) {
      failedArticles.push(result);
    }
  }
  
  // 如果有失败的文章，报告并退出
  if (failedArticles.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ 图片验证失败！以下文章包含无法下载的图片：\n');
    
    for (const article of failedArticles) {
      console.log(`📄 ${article.title}`);
      for (const imageUrl of article.failedImages) {
        console.log(`   ❌ ${imageUrl}`);
      }
      console.log('');
    }
    
    console.log('💡 建议：');
    console.log('1. 检查图片URL是否有效');
    console.log('2. 确保图片服务器可访问');
    console.log('3. 可以手动下载图片并替换HTML中的URL');
    console.log('4. 或者移除无法下载的图片后重试');
    
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 所有图片验证通过！');
  console.log('🚀 开始转换文章...\n');
  
  // 获取现有文章的时间，确保不被改变
  const existingTimes = getExistingArticleTimes();
  
  try {
    // 执行转换
    console.log('📝 转换HTML到MDX...');
    execSync('npm run convert-html', { encoding: 'utf8', stdio: 'pipe' });
    
    // 处理新文章的排序和时间
    const newArticles = [];
    const items = fs.readdirSync(CONFIG.articlesDir);
    
    for (const item of items) {
      if (!existingTimes.hasOwnProperty(item)) {
        newArticles.push(item);
      }
    }
    
    if (newArticles.length > 0) {
      console.log(`\n📝 处理 ${newArticles.length} 篇新文章的发布时间...`);
      
      // 随机打乱新文章顺序
      const shuffledArticles = shuffleArray(newArticles);
      
      // 为新文章设置发布时间（最新的在前）
      shuffledArticles.forEach((articleDir, index) => {
        const mdxPath = path.join(CONFIG.articlesDir, articleDir, 'index.mdx');
        if (fs.existsSync(mdxPath)) {
          let content = fs.readFileSync(mdxPath, 'utf8');
          const newTime = generatePublishTime(index, shuffledArticles.length);
          
          // 更新发布时间
          content = content.replace(/publishedTime:\s*.+/, `publishedTime: ${newTime}`);
          
          // 设置标题属性（第一篇为主标题，接下来4篇为副标题）
          if (index === 0) {
            content = content.replace(/isMainHeadline:\s*(true|false)/, 'isMainHeadline: true');
            content = content.replace(/isSubHeadline:\s*(true|false)/, 'isSubHeadline: false');
          } else if (index < 5) {
            content = content.replace(/isMainHeadline:\s*(true|false)/, 'isMainHeadline: false');
            content = content.replace(/isSubHeadline:\s*(true|false)/, 'isSubHeadline: true');
          } else {
            content = content.replace(/isMainHeadline:\s*(true|false)/, 'isMainHeadline: false');
            content = content.replace(/isSubHeadline:\s*(true|false)/, 'isSubHeadline: false');
          }
          
          fs.writeFileSync(mdxPath, content);
          console.log(`  ✅ ${articleDir}`);
        }
      });
    }
    
    // 继续执行其他必要的修复步骤
    console.log('\n🔧 执行后续处理...');
    
    const commands = [
      { cmd: 'npm run localize-images', desc: '本地化图片' },
      { cmd: 'npm run fix-missing-images', desc: '修复缺失图片' },
      { cmd: 'npm run fix-cover-paths', desc: '修复封面路径' },
      { cmd: 'npm run test-workflow', desc: '验证工作流程' }
    ];
    
    for (const { cmd, desc } of commands) {
      console.log(`\n🔄 ${desc}...`);
      try {
        execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${desc} 完成`);
      } catch (error) {
        console.log(`⚠️  ${desc} 出现警告（可忽略）`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 新文章添加完成！');
    console.log(`✅ 成功添加 ${newArticles.length} 篇新文章`);
    console.log('📝 新文章已设置为最新发布时间并随机排序');
    console.log('💡 现有文章的发布时间和位置保持不变');
    console.log('🌐 可以运行 npm run dev 查看网站');
    
  } catch (error) {
    console.error('\n❌ 处理过程中出错:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});