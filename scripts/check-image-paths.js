#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  assetsDir: path.join(__dirname, '../src/assets/images/articles')
};

async function checkImagePaths() {
  console.log('🔍 检查所有图片路径...');
  
  // 获取所有文章目录
  const articleDirs = fs.readdirSync(CONFIG.articlesDir).filter(item => {
    const fullPath = path.join(CONFIG.articlesDir, item);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'index.mdx'));
  });
  
  console.log(`📄 找到 ${articleDirs.length} 篇文章`);
  
  let totalImages = 0;
  let brokenImages = 0;
  const brokenPaths = [];
  
  for (const slug of articleDirs) {
    const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
    const content = fs.readFileSync(articlePath, 'utf8');
    
    // 查找所有图片引用
    const imageRegex = /!\[[^\]]*\]\(@assets\/images\/articles\/([^)]+)\)/g;
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
      totalImages++;
      const imagePath = match[1]; // 提取相对路径
      const fullImagePath = path.join(CONFIG.assetsDir, imagePath);
      
      if (!fs.existsSync(fullImagePath)) {
        brokenImages++;
        brokenPaths.push({
          article: slug,
          imagePath: imagePath,
          fullPath: fullImagePath
        });
        console.log(`❌ ${slug}: 图片不存在 - ${imagePath}`);
      }
    }
  }
  
  console.log(`\n📊 检查结果:`);
  console.log(`📄 总文章数: ${articleDirs.length}`);
  console.log(`🖼️  总图片引用数: ${totalImages}`);
  console.log(`✅ 正常图片: ${totalImages - brokenImages}`);
  console.log(`❌ 损坏图片: ${brokenImages}`);
  
  if (brokenImages > 0) {
    console.log(`\n🚨 发现 ${brokenImages} 个损坏的图片路径:`);
    brokenPaths.forEach(broken => {
      console.log(`   - ${broken.article}: ${broken.imagePath}`);
    });
    console.log('\n💡 请修复这些路径后再构建项目');
    process.exit(1);
  } else {
    console.log('\n🎉 所有图片路径都正常！可以安全构建项目。');
    process.exit(0);
  }
}

checkImagePaths().catch(console.error);