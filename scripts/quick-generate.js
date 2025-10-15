import { config } from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function quickGenerate() {
  console.log('🚀 Quick Article Generation Test...\n');
  
  const topic = "Blockchain Infrastructure for Asset Tokenization";
  const keywords = ["blockchain infrastructure", "asset tokenization", "distributed ledger", "smart contracts"];
  
  try {
    // 1. 生成图片URLs（使用Lorem Picsum）
    console.log('🖼️ Generating image URLs...');
    const images = [
      `https://picsum.photos/1024/576?random=${Date.now()}`,
      `https://picsum.photos/1024/576?random=${Date.now() + 1}`,
      `https://picsum.photos/1024/576?random=${Date.now() + 2}`,
      `https://picsum.photos/1024/576?random=${Date.now() + 3}`
    ];
    console.log('✅ Images ready\n');
    
    // 2. 生成简化的文章（一次性生成，避免多次API调用）
    console.log('📝 Generating article content...');
    const prompt = `Write a comprehensive HTML article about "${topic}" with the following structure:

1. A compelling introduction (300 words)
2. Three main sections with detailed content (500 words each):
   - Understanding Blockchain Infrastructure
   - Benefits of Asset Tokenization
   - Implementation and Best Practices
3. A conclusion (200 words)
4. 3 FAQs with answers

Include these keywords naturally: ${keywords.join(', ')}

Format the output as clean HTML with <h1>, <h2>, <h3>, <p>, <ul>, <li> tags.
Do NOT include DOCTYPE, html, head, or body tags.
Do NOT include any code block markers.

Write professional, informative content suitable for investors and technology professionals.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    // 3. 构建完整HTML
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${topic}</title>
  <meta name="description" content="Comprehensive guide to blockchain infrastructure for asset tokenization, covering distributed ledger technology and smart contracts." />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
${response.choices[0].message.content}

<img src="${images[0]}" alt="${topic} - Overview" />

<img src="${images[1]}" alt="${topic} - Infrastructure" />

<img src="${images[2]}" alt="${topic} - Benefits" />

<img src="${images[3]}" alt="${topic} - Implementation" />
</body>
</html>`;
    
    // 4. 保存文件
    const outputDir = path.join(__dirname, '..', 'newarticle');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = 'Blockchain Infrastructure for Asset Tokenization.html';
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, htmlContent, 'utf-8');
    
    // 5. 统计结果
    const wordCount = htmlContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
    
    console.log('\n✅ Article Generated Successfully!');
    console.log('=====================================');
    console.log(`📁 File: ${fileName}`);
    console.log(`📊 Word Count: ~${wordCount} words`);
    console.log(`🖼️ Images: 4 Lorem Picsum images`);
    console.log('\n📸 Image URLs:');
    images.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    console.log('\n🎉 Done! Article is ready.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickGenerate();