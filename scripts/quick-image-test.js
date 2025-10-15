import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 修复后的混合方案生成图片
 */
async function generateHybridImages(openai, topic, keywords) {
  const images = [];
  
  // 第一张用DALL-E生成主图（10秒超时）
  try {
    console.log('🎨 Generating AI hero image...');
    const heroResponse = await Promise.race([
      openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional hero image for article about ${topic}, modern business illustration style, clean and engaging, high quality`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DALL-E timeout after 10s')), 10000))
    ]);
    images.push(heroResponse.data[0].url);
    console.log('✅ AI hero image generated successfully');
  } catch (error) {
    console.log(`⚠️  DALL-E failed (${error.message}), using high-quality placeholder`);
    const fallbackUrl = `https://picsum.photos/1024/576?random=${Date.now()}`;
    images.push(fallbackUrl);
  }
  
  // 其他图片使用Lorem Picsum（更可靠的随机图片服务）
  for (let i = 0; i < 3; i++) {
    images.push(`https://picsum.photos/1024/576?random=${Date.now() + i + 1}`);
  }
  
  console.log('✅ All images prepared successfully!');
  return images;
}

// 生成测试HTML文件
async function createTestHTML() {
  console.log('🧪 Generating test images and HTML file...\n');
  
  try {
    // 生成图片
    const images = await generateHybridImages(
      openai, 
      'DeFi Security Best Practices',
      ['defi', 'security', 'blockchain', 'smart contracts']
    );
    
    // 创建HTML内容
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>图片测试 - 修复后的图片系统</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; text-align: center; }
    .image-container { margin: 20px 0; text-align: center; }
    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .image-info { margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .success { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🖼️ 图片系统测试结果</h1>
  <p class="success">✅ 已成功修复图片链接问题！现在使用可靠的Lorem Picsum服务。</p>
  
  ${images.map((url, index) => `
    <div class="image-container">
      <h3>图片 ${index + 1} ${index === 0 ? '(DALL-E或备选方案)' : '(Lorem Picsum)'}</h3>
      <img src="${url}" alt="测试图片 ${index + 1}" loading="lazy" />
      <div class="image-info">
        <strong>URL:</strong> <a href="${url}" target="_blank">${url}</a>
      </div>
    </div>
  `).join('')}
  
  <div style="margin-top: 40px; padding: 20px; background: #e8f5e8; border-radius: 8px;">
    <h3>✅ 修复说明</h3>
    <ul>
      <li><strong>第1张图片:</strong> 尝试DALL-E生成，失败则使用Lorem Picsum</li>
      <li><strong>其他图片:</strong> 使用稳定的Lorem Picsum服务</li>
      <li><strong>服务优势:</strong> Lorem Picsum提供高质量真实照片，完全免费且稳定</li>
      <li><strong>自动处理:</strong> 每个随机参数对应不同的图片，确保多样性</li>
    </ul>
  </div>
  
  <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
    <strong>⏰ 生成时间:</strong> ${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>`;

    // 保存文件
    const outputPath = path.join(__dirname, '..', 'newarticle', '图片测试-修复后系统.html');
    await fs.writeFile(outputPath, htmlContent, 'utf-8');
    
    console.log(`\n✅ 测试文件已生成: 图片测试-修复后系统.html`);
    console.log(`📊 共生成 ${images.length} 个图片链接`);
    console.log('🌐 所有图片URL均使用可靠的Lorem Picsum服务');
    
    // 验证URL格式
    console.log('\n🔍 URL验证:');
    images.forEach((url, index) => {
      if (url.includes('picsum.photos')) {
        console.log(`✅ 图片${index + 1}: Lorem Picsum格式正确`);
      } else if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
        console.log(`✅ 图片${index + 1}: DALL-E生成成功`);
      } else {
        console.log(`⚠️  图片${index + 1}: 未知URL格式`);
      }
    });

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
createTestHTML();