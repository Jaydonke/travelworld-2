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
 * 最终修复版图片生成函数
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
    images.push(`https://picsum.photos/1024/576?random=${Date.now()}`);
  }
  
  // 其他图片使用Lorem Picsum
  for (let i = 0; i < 3; i++) {
    images.push(`https://picsum.photos/1024/576?random=${Date.now() + i + 1}`);
  }
  
  console.log('✅ All images prepared successfully!');
  return images;
}

// 生成完整测试文章
async function generateFinalTestArticle() {
  console.log('🧪 Testing final article generation with all fixes...\n');
  
  const article = {
    topic: "Regulatory Compliance in DeFi Tokenization",
    keywords: ["regulatory compliance", "defi tokenization", "financial regulations", "blockchain compliance"],
    category: "Regulatory"
  };
  
  try {
    // 生成图片
    const images = await generateHybridImages(openai, article.topic, article.keywords);
    
    // Step 1: Generate outline
    console.log('📋 Generating comprehensive outline...');
    const outlinePrompt = `Create a detailed outline for a comprehensive 4000-5000 word article about "${article.topic}".

Generate a JSON outline with this EXACT structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaDescription": "150-160 character meta description with keyword",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": ["Subsection 1", "Subsection 2", "Subsection 3"]
    }
  ]
}

Requirements:
- Title must include main keyword "regulatory compliance" and "DeFi tokenization"
- Meta description must be exactly 150-160 characters
- Create 7-8 main sections with 3-4 subsections each
- Cover regulatory frameworks, compliance challenges, best practices, and future trends
- Make headings clear and professional`;

    const outlineResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: outlinePrompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const outlineText = outlineResponse.choices[0].message.content;
    const outline = JSON.parse(outlineText.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
    
    console.log(`✅ Outline generated: ${outline.sections.length} sections`);
    
    // Build HTML content
    let content = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${outline.title}</title>
  <meta name="description" content="${outline.metaDescription || 'Comprehensive guide to regulatory compliance in DeFi tokenization and blockchain technology.'}" />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
<h1>${outline.title}</h1>

<h2>Introduction</h2>`;

    // Generate introduction
    console.log('✍️  Generating professional introduction...');
    const introPrompt = `Write a compelling 500-word introduction for "${outline.title}".

Requirements:
- Hook readers with current regulatory challenges in DeFi
- Explain why regulatory compliance matters in tokenization
- Include keywords: ${article.keywords.join(', ')}
- End with what the article will cover
- Write in professional, authoritative tone
- Do NOT include any code block markers`;

    const introResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: introPrompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const intro = introResponse.choices[0].message.content.split('\n')
      .filter(p => p.trim())
      .map(p => `<p>${p}</p>`)
      .join('\n');
    
    content += '\n' + intro + '\n';
    content += `\n<img src="${images[0]}" alt="${article.topic}" />\n`;

    // Generate each section
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      const sectionTitle = section.heading || section.title || `Section ${i + 1}`;
      
      console.log(`📝 Generating section ${i + 1}/${outline.sections.length}: ${sectionTitle}...`);
      
      const sectionPrompt = `Write a comprehensive 700-900 word section for "${sectionTitle}" in an article about ${article.topic}.

${section.subsections && section.subsections.length > 0 ? `Cover these subsections:
${section.subsections.map(s => `- ${s}`).join('\n')}` : ''}

Requirements:
- Write detailed, authoritative content with specific examples
- Include relevant data, statistics, and case studies where applicable
- Use keywords naturally: ${article.keywords.join(', ')}
- Format with HTML: <h2> for main heading, <h3> for subsections, <p> for paragraphs, <ul>/<ol> for lists
- Make content actionable and valuable for DeFi professionals
- Write in clear, professional English
- Do NOT include any code block markers or formatting tags outside of HTML`;

      const sectionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: sectionPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      content += '\n' + sectionResponse.choices[0].message.content + '\n';
      
      // Add images strategically
      if ((i + 1) % 2 === 0 && i < images.length - 1) {
        content += `\n<img src="${images[Math.floor(i/2) + 1]}" alt="${sectionTitle}" />\n`;
      }
    }

    // Generate conclusion
    console.log('📝 Generating comprehensive conclusion...');
    const conclusionPrompt = `Write a compelling 400-word conclusion for "${outline.title}".

Summarize key points:
${outline.sections.map(s => `- ${s.heading || s.title}`).join('\n')}

Requirements:
- Synthesize main regulatory compliance strategies
- Provide actionable next steps for DeFi projects
- Include call to action for staying compliant
- Reinforce article value
- Use HTML formatting
- Do NOT include code block markers`;

    const conclusionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: conclusionPrompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    content += '\n<h2>Conclusion</h2>\n' + conclusionResponse.choices[0].message.content + '\n';

    // Generate FAQs
    console.log('❓ Generating comprehensive FAQs...');
    const faqPrompt = `Generate 8 detailed FAQs for "${article.topic}".

Format as HTML:
<h2>Frequently Asked Questions</h2>
<h3>Question 1?</h3>
<p>Detailed answer...</p>

Requirements:
- Each answer 120-200 words with specific details
- Cover different compliance aspects
- Include practical guidance
- No code block markers`;

    const faqResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: faqPrompt }],
      temperature: 0.7,
      max_tokens: 2500
    });

    content += '\n' + faqResponse.choices[0].message.content;
    content += '\n</body>\n</html>';
    
    // Clean content
    content = content.replace(/```html\n?/g, '').replace(/\n?```/g, '');
    
    // Save file
    const outputDir = path.join(__dirname, '..', 'newarticle');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = 'Regulatory Compliance in DeFi Tokenization.html';
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Count words
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    
    console.log('\n✅ Final test article generated successfully!');
    console.log(`📁 Saved as: ${fileName}`);
    console.log(`📊 Word count: ${wordCount} words`);
    console.log(`📑 Sections: ${outline.sections.length}`);
    console.log(`🖼️ Images: ${images.length} (using ${images[0].includes('picsum') ? 'Lorem Picsum' : 'DALL-E + Lorem Picsum'})`);
    
    // Show first few image URLs for verification
    console.log('\n🔗 Image URLs:');
    images.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
    return {
      fileName,
      wordCount,
      sections: outline.sections.length,
      images: images.length,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Article generation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
generateFinalTestArticle();