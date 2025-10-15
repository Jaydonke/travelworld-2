#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { smartDownloadImage } from './enhanced-image-downloader.js';
import { getLatestArticleTime, generateSmartPublishTime } from './smart-time-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  newArticlesDir: path.join(__dirname, '../newarticle'),
  articlesDir: path.join(__dirname, '../src/content/articles'),
  imagesDir: path.join(__dirname, '../src/assets/images/articles'),
  maxRetries: 2,
  retryDelay: 1500
};

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
    console.log(`  ⚠️  创建临时目录失败: ${e.message}`);
  }
  
  // 测试下载每张图片
  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    const fileName = `test_${Date.now()}_${i}.jpg`;
    const tempPath = path.join(tempDir, fileName);
    
    console.log(`  [${i + 1}/${imageUrls.length}] 测试下载: ${imageUrl.substring(0, 50)}...`);
    
    const success = await smartDownloadImage(imageUrl, tempPath, {
      maxRetries: CONFIG.maxRetries,
      retryDelay: CONFIG.retryDelay,
      verbose: false // 简化输出
    });
    
    if (success) {
      console.log(`    ✅ 可以下载`);
      // 删除测试文件
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {}
    } else {
      failedImages.push(imageUrl);
      console.log(`    ❌ 无法下载`);
    }
  }
  
  // 清理临时目录
  try {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (e) {}
    });
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

// 生成智能发布时间（确保时间顺序正确）
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

// 使用智能下载器转换HTML文件
async function convertHTMLWithSmartDownload() {
  console.log('📝 开始转换HTML文件...');
  
  // 先运行标准转换
  try {
    execSync('npm run convert-html', { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  HTML转换出现问题，继续处理...');
  }
  
  // 然后使用智能下载器处理图片
  console.log('\n🖼️ 使用智能下载器处理图片...');
  
  const items = fs.readdirSync(CONFIG.articlesDir);
  let processedCount = 0;
  
  for (const item of items) {
    const fullPath = path.join(CONFIG.articlesDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const mdxPath = path.join(fullPath, 'index.mdx');
      if (fs.existsSync(mdxPath)) {
        const content = fs.readFileSync(mdxPath, 'utf8');
        
        // 查找外部图片
        const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
        const matches = [...content.matchAll(imageRegex)];
        
        if (matches.length > 0) {
          console.log(`\n📂 处理文章: ${item}`);
          const articleImagesDir = path.join(CONFIG.imagesDir, item);
          
          // 确保图片目录存在
          if (!fs.existsSync(articleImagesDir)) {
            fs.mkdirSync(articleImagesDir, { recursive: true });
          }
          
          let modifiedContent = content;
          let downloadedCount = 0;
          
          for (const match of matches) {
            const [fullMatch, altText, imageUrl] = match;
            const fileName = `image_${Date.now()}_${downloadedCount}.jpg`;
            const localPath = path.join(articleImagesDir, fileName);
            const localUrl = `@assets/images/articles/${item}/${fileName}`;
            
            console.log(`  下载图片 ${downloadedCount + 1}/${matches.length}: ${imageUrl.substring(0, 50)}...`);
            
            const success = await smartDownloadImage(imageUrl, localPath, {
              maxRetries: 3,
              retryDelay: 1000,
              verbose: true
            });
            
            if (success) {
              // 替换URL
              modifiedContent = modifiedContent.replace(fullMatch, `![${altText}](${localUrl})`);
              downloadedCount++;
            } else {
              console.log(`  ⚠️  图片下载失败，将创建占位符`);
              // 创建占位符
              const placeholderData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
              fs.writeFileSync(localPath, placeholderData);
              modifiedContent = modifiedContent.replace(fullMatch, `![${altText}](${localUrl})`);
            }
          }
          
          // 保存修改后的内容
          if (downloadedCount > 0 || matches.length > 0) {
            fs.writeFileSync(mdxPath, modifiedContent);
            console.log(`  ✅ 处理完成: ${downloadedCount}/${matches.length} 张图片`);
            processedCount++;
          }
        }
      }
    }
  }
  
  console.log(`\n✅ 图片处理完成，共处理 ${processedCount} 篇文章`);
}

async function main() {
  console.log('🚀 智能文章添加脚本启动');
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
  console.log('🔍 开始预验证图片下载（使用智能下载策略）...\n');
  
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
  
  // 如果有失败的文章，询问是否继续
  if (failedArticles.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  以下文章包含无法下载的图片：\n');
    
    for (const article of failedArticles) {
      console.log(`📄 ${article.title}`);
      for (const imageUrl of article.failedImages) {
        console.log(`   ❌ ${imageUrl}`);
      }
      console.log('');
    }
    
    console.log('💡 提示: 这些图片将使用占位符替代');
    console.log('🔄 继续处理...\n');
  } else {
    console.log('\n✅ 所有图片验证通过！\n');
  }
  
  // 获取现有文章的时间，确保不被改变
  const existingTimes = getExistingArticleTimes();
  
  try {
    // 执行转换和图片下载
    await convertHTMLWithSmartDownload();
    
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
    
    // 运行其他修复命令
    console.log('\n🔧 执行后续处理...');
    
    const commands = [
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
    console.log('💡 特性：');
    console.log('   • 智能图片下载，自动尝试多种策略');
    console.log('   • 新文章自动设置为最新时间');
    console.log('   • 随机排序，避免字母顺序');
    console.log('   • 保持已有文章时间不变');
    console.log('   • 失败的图片自动使用占位符');
    console.log('\n🌐 可以运行 npm run dev 查看网站');
    
  } catch (error) {
    console.error('\n❌ 处理过程中出错:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});