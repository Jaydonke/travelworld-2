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
 * 混合方案生成图片：第一张用DALL-E，其他用Unsplash
 */
async function generateHybridImages(openai, topic, keywords) {
  const images = [];
  
  // 第一张用DALL-E生成主图（15秒超时）
  try {
    console.log('    🎨 Generating AI hero image...');
    const heroResponse = await Promise.race([
      openai.images.generate({
        model: "dall-e-3",
        prompt: `Professional hero image for article about ${topic}, modern business illustration style, clean and engaging, high quality`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DALL-E timeout after 15s')), 15000))
    ]);
    images.push(heroResponse.data[0].url);
    console.log('    ✅ AI hero image generated successfully');
  } catch (error) {
    console.log(`    ⚠️  DALL-E failed (${error.message}), using high-quality placeholder`);
    images.push(`https://picsum.photos/1024/576?random=${Date.now()}`);
  }
  
  // 其他图片使用Lorem Picsum（更可靠的随机图片服务）
  for (let i = 0; i < 3; i++) {
    images.push(`https://picsum.photos/1024/576?random=${Date.now() + i + 1}`);
  }
  
  console.log('    🖼️  All images prepared (1 AI + 3 Lorem Picsum)');
  return images;
}

// Generate a single test article
async function generateTestArticle() {
  console.log('\n🔬 Testing single article generation with full segmentation...\n');
  
  const article = {
    topic: "Smart Contract Security in Asset Tokenization",
    keywords: ["smart contract security", "tokenization security", "blockchain security", "DeFi security"],
    category: "Technical"
  };
  
  try {
    // Step 1: Generate outline
    console.log('📋 Generating outline...');
    const outlinePrompt = `Create a detailed outline for a comprehensive article about "${article.topic}".

Generate a JSON outline with this EXACT structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaDescription": "150-160 character meta description with keyword",
  "sections": [
    {
      "heading": "Section Title",
      "subsections": ["Subsection 1", "Subsection 2"]
    }
  ]
}

Requirements:
- Title must include the main keyword
- Meta description must be 150-160 characters
- Create 7-8 main sections with 2-3 subsections each
- Make section headings clear and informative`;

    const outlineResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: outlinePrompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    const outlineText = outlineResponse.choices[0].message.content;
    const outline = JSON.parse(outlineText.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
    
    console.log(`✅ Outline generated: ${outline.sections.length} sections`);
    
    // Step 2: Generate introduction
    console.log('✍️  Generating introduction...');
    const introPrompt = `Write a compelling 400-word introduction for an article titled "${outline.title}".

Requirements:
- Open with a hook that grabs attention
- Introduce the main topic and its importance
- Include keywords naturally: ${article.keywords.join(', ')}
- End with what the article will cover
- Write in clear, professional English
- Do NOT include any code block markers or formatting tags`;

    const introResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: introPrompt }],
      temperature: 0.7,
      max_tokens: 800
    });

    let content = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>${outline.title}</title>
  <meta name="description" content="${outline.metaDescription || 'Comprehensive guide on ' + article.topic}" />
  <style type="text/css">
    .field{margin-bottom:20px}.field_name{color:#686868;font-size:11px}.wp-box{background:#fff;border:1px solid #e0e0e0;padding:15px 20px;margin-bottom:20px;border-radius:5px}.wp-link{font-size:11px}.wp-ctrl{padding-bottom:15px}.wp-img{text-align:center}.wp-btn{display:inline-block;font-weight:600;font-size:16px;line-height:55px;background:#FE7879;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px;margin-top:15px}.wp-btn:hover{background:#e97374;color:#fff}.wed-field{margin-top:15px}.wed-field label{color:#686868;font-size:11px}img{max-width:100%}.button{display:inline-block;font-weight:600;font-size:16px;line-height:55px;border-radius:5px;color:#fff;text-decoration:none;padding:0 90px}.button:hover{text-decoration:none!important}.features{font-weight:600;font-size:24px;line-height:29px;min-height:29px!important}.wp-box .wed-field label{font-weight:600;font-size:20px;line-height:24px;color:#000;position:absolute}.wp-box .wed-field label+.wed-field-text{padding-top:35px;line-height:25px;min-height:60px}.wp-box .wed-field{margin:40px 0}.wp-box p,.wp-box h1,.wp-box h2,.wp-box h3{margin:0}sup.citation{background:#e5efff;width:15px;height:15px;color:#0062ff;text-align:center;font-size:10px;line-height:15px;border-radius:8px;font-weight:500;display:inline-block;margin-left:2px;cursor:pointer;font-style:normal}.primary-bg{background:#FE7879}.button{background:#FE7879;color:#fff}.button:hover{background:#E46C6D;color:#fff}.features{color:#FE7879}
  </style>
</head>
<body>
<h1>${outline.title}</h1>

<h2>Introduction</h2>
${introResponse.choices[0].message.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n')}

<img src="https://via.placeholder.com/1024x576/FE7879/ffffff?text=${encodeURIComponent(article.topic + ' - Hero Image')}" alt="${article.topic}" />
`;

    // Step 3: Generate each section
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      const sectionTitle = section.heading || section.title || `Section ${i + 1}`;
      
      console.log(`📝 Generating section ${i + 1}/${outline.sections.length}: ${sectionTitle}...`);
      
      const sectionPrompt = `Write a comprehensive 800-1000 word section for "${sectionTitle}" in an article about ${article.topic}.

${section.subsections ? `Cover these subsections:
${section.subsections.map(s => `- ${s}`).join('\n')}` : ''}

Requirements:
- Write detailed, informative content
- Include specific examples and data where relevant
- Use keywords naturally: ${article.keywords.join(', ')}
- Format with HTML tags: <h2> for main heading, <h3> for subsections, <p> for paragraphs, <ul>/<ol> for lists
- Make content actionable and valuable for readers
- Write in clear, professional English
- Do NOT include any code block markers or HTML/head/body tags`;

      const sectionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: sectionPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      content += '\n' + sectionResponse.choices[0].message.content + '\n';
      
      // Add an image after every 2 sections
      if ((i + 1) % 2 === 0) {
        const imageTypes = ['Infographic', 'Concept Illustration', 'Comparison Chart', 'Process Diagram'];
        const imageType = imageTypes[Math.floor(i / 2) % imageTypes.length];
        content += `\n<img src="https://via.placeholder.com/1024x576/FE7879/ffffff?text=${encodeURIComponent(article.topic + ' - ' + imageType)}" alt="${article.topic} ${imageType}" />\n`;
      }
    }

    // Step 4: Generate conclusion
    console.log('📝 Generating conclusion...');
    const conclusionPrompt = `Write a compelling 500-word conclusion for an article about "${article.topic}".

Key points covered in the article:
${outline.sections.map(s => `- ${s.heading || s.title}`).join('\n')}

Requirements:
- Summarize key takeaways
- Provide actionable next steps
- Include a call to action
- Reinforce the value of the information
- Use HTML formatting: <h2>, <p>, <ul> tags
- Do NOT include any code block markers`;

    const conclusionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: conclusionPrompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    content += '\n' + conclusionResponse.choices[0].message.content + '\n';

    // Step 5: Generate FAQs
    console.log('❓ Generating FAQs...');
    const faqPrompt = `Generate 5 comprehensive FAQs for an article about "${article.topic}".

Format as HTML:
<h2>Frequently Asked Questions</h2>
<h3>Question 1?</h3>
<p>Detailed answer...</p>
<h3>Question 2?</h3>
<p>Detailed answer...</p>

Requirements:
- Each answer should be 100-150 words
- Cover different aspects of the topic
- Provide valuable, specific information
- Do NOT include any code block markers`;

    const faqResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: faqPrompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    content += '\n' + faqResponse.choices[0].message.content;

    // Close HTML
    content += '\n</body>\n</html>';
    
    // Clean any code block markers that might have slipped through
    content = content.replace(/```html\n?/g, '').replace(/\n?```/g, '');
    
    // Generate better images using hybrid approach
    console.log('🖼️  Generating better images...');
    const betterImages = await generateHybridImages(openai, article.topic, article.keywords);
    
    // Replace placeholder images with better ones
    const imageReplacements = [
      [article.topic + ' - Hero Image', betterImages[0]],
      [article.topic + ' - Infographic', betterImages[1]],
      [article.topic + ' - Concept Illustration', betterImages[2]],
      [article.topic + ' - Process Diagram', betterImages[3]]
    ];
    
    imageReplacements.forEach(([placeholder, newUrl]) => {
      const oldUrl = `https://via.placeholder.com/1024x576/FE7879/ffffff?text=${encodeURIComponent(placeholder)}`;
      content = content.replace(oldUrl, newUrl);
    });
    
    // Save the file
    const outputDir = path.join(__dirname, '..', 'newarticle');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = article.topic.replace(/[^a-z0-9]+/gi, ' ').trim() + '.html';
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Count words
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = textContent.split(' ').filter(w => w.length > 0).length;
    
    console.log('\n✅ Article generated successfully!');
    console.log(`📁 Saved to: ${fileName}`);
    console.log(`📊 Word count: ${wordCount} words`);
    console.log(`📑 Sections: ${outline.sections.length}`);
    
  } catch (error) {
    console.error('❌ Error generating article:', error.message);
    if (error.response) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
generateTestArticle();