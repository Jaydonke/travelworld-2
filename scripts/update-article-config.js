import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Read config.txt
function readConfigFile() {
  const configPath = path.join(__dirname, '..', 'config.txt');
  const content = fs.readFileSync(configPath, 'utf-8').trim();
  const lines = content.split('\n').map(line => line.trim());
  
  return {
    theme: lines[0] || 'Entertainment & Pop Culture',
    domain: lines[1] || 'Popzic.com',
    siteName: lines[2] || 'PopZic'
  };
}

// Read categories from config.template.js
function readCategories() {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  const content = fs.readFileSync(configPath, 'utf-8');
  
  // Extract categories array from CURRENT_WEBSITE_CONTENT
  const match = content.match(/"categories":\s*\[([\s\S]*?)\]/);
  if (match) {
    // Parse the categories array
    const categoriesStr = '[' + match[1] + ']';
    try {
      // Clean up the string and parse it
      const cleanedStr = categoriesStr.replace(/"/g, '"').replace(/,\s*$/, '');
      const categories = JSON.parse(cleanedStr);
      return categories;
    } catch (e) {
      // Fallback: extract categories manually
      const categoryMatches = match[1].matchAll(/"([^"]+)"/g);
      return Array.from(categoryMatches, m => m[1]);
    }
  }
  
  // Default categories if extraction fails
  return [
    "movies",
    "music", 
    "tv-shows",
    "celebrity-news",
    "reviews",
    "events",
    "trending",
    "pop-culture"
  ];
}

// Generate the prompt for GPT
function generatePrompt(themeInfo, categories) {
  const template = {
    enabled: true,
    articles: [
      // GPT will fill this with 25 articles
    ]
  };

  const exampleArticle = {
    topic: "Example Article Title",
    keywords: ["keyword1", "keyword2", "keyword3", "keyword4"],
    category: "category-from-list"
  };

  return `You are a content strategist specializing in ${themeInfo.theme}. 
Generate exactly 25 unique article topics for a website called ${themeInfo.siteName} (${themeInfo.domain}).

IMPORTANT: Return ONLY valid JSON, no markdown, no comments, no explanations.

Available categories (use ONLY these exact category names):
${JSON.stringify(categories, null, 2)}

Return a JSON object with this exact structure:
${JSON.stringify(template, null, 2)}

Where the articles array contains exactly 25 objects, each with this structure:
${JSON.stringify(exampleArticle, null, 2)}

Requirements:
1. Each topic must be unique and engaging for ${themeInfo.theme} audience
2. Topics should be diverse, covering different aspects of ${themeInfo.theme}
3. Each topic must have exactly 4 relevant keywords
4. Category MUST be one from the provided list above
5. Topics should be SEO-friendly and compelling
6. Mix evergreen content with trending topics
7. Include beginner guides, deep dives, comparisons, and analysis articles
8. Topics should appeal to both casual fans and enthusiasts

Return ONLY the JSON object, nothing else.`;
}

// Clean GPT response to extract valid JSON
function cleanGPTResponse(response) {
  let cleaned = response.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove any non-JSON content before the first {
  const jsonStart = cleaned.indexOf('{');
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Remove any non-JSON content after the last }
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonEnd > -1 && jsonEnd < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEnd + 1);
  }
  
  return cleaned;
}

// Generate article configuration using GPT
async function generateArticleConfig(themeInfo, categories) {
  try {
    console.log('Generating article configuration for:', themeInfo.theme);
    console.log('Using categories:', categories);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a content strategist. Return ONLY valid JSON, no markdown, no explanations."
        },
        {
          role: "user",
          content: generatePrompt(themeInfo, categories)
        }
      ],
      temperature: 0.8,
      max_tokens: 6000,
    });

    const content = response.choices[0].message.content;
    const cleanedContent = cleanGPTResponse(content);
    
    // Parse and validate the JSON
    const config = JSON.parse(cleanedContent);
    
    // Validate structure
    if (!config.articles || !Array.isArray(config.articles)) {
      throw new Error('Invalid response structure: missing articles array');
    }
    
    if (config.articles.length !== 25) {
      console.warn(`Expected 25 articles, got ${config.articles.length}. Adjusting...`);
    }
    
    // Validate each article has required fields and valid category
    config.articles = config.articles.map((article, index) => {
      if (!article.topic || !article.keywords || !article.category) {
        throw new Error(`Article ${index + 1} missing required fields`);
      }
      
      // Ensure category is valid
      if (!categories.includes(article.category)) {
        console.warn(`Invalid category "${article.category}" for article "${article.topic}". Using first category.`);
        article.category = categories[0];
      }
      
      // Ensure exactly 4 keywords
      if (!Array.isArray(article.keywords)) {
        article.keywords = [];
      }
      if (article.keywords.length > 4) {
        article.keywords = article.keywords.slice(0, 4);
      }
      while (article.keywords.length < 4) {
        article.keywords.push(themeInfo.theme.toLowerCase());
      }
      
      return article;
    });
    
    // Ensure exactly 25 articles
    while (config.articles.length < 25) {
      config.articles.push({
        topic: `${themeInfo.theme} Article ${config.articles.length + 1}`,
        keywords: [themeInfo.theme.toLowerCase(), "guide", "tips", "trends"],
        category: categories[0]
      });
    }
    
    if (config.articles.length > 25) {
      config.articles = config.articles.slice(0, 25);
    }
    
    return config;
  } catch (error) {
    console.error('Error generating config:', error);
    throw error;
  }
}

// Update config.template.js with new ARTICLE_GENERATION_CONFIG
function updateConfigTemplate(articleConfig) {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  
  // Backup current file
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = configPath + `.backup-articles-${timestamp}.js`;
  fs.copyFileSync(configPath, backupPath);
  console.log(`Backup created: ${backupPath}`);
  
  // Read current config
  let content = fs.readFileSync(configPath, 'utf-8');
  
  // Generate new ARTICLE_GENERATION_CONFIG string
  const newArticleConfig = `export const ARTICLE_GENERATION_CONFIG = ${JSON.stringify(articleConfig, null, 2)};`;
  
  // Replace ARTICLE_GENERATION_CONFIG section
  const startMarker = 'export const ARTICLE_GENERATION_CONFIG = {';
  const endMarker = '};';
  
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error('Could not find ARTICLE_GENERATION_CONFIG in config.template.js');
  }
  
  // Find the matching closing brace
  let braceCount = 0;
  let endIndex = startIndex + startMarker.length;
  let foundEnd = false;
  
  for (let i = endIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      if (braceCount === 0) {
        endIndex = i + 1;
        foundEnd = true;
        break;
      }
      braceCount--;
    }
  }
  
  if (!foundEnd) {
    throw new Error('Could not find end of ARTICLE_GENERATION_CONFIG');
  }
  
  // Replace the section
  content = content.substring(0, startIndex) + newArticleConfig + content.substring(endIndex);
  
  // Write updated config
  fs.writeFileSync(configPath, content, 'utf-8');
  console.log('config.template.js updated with new ARTICLE_GENERATION_CONFIG');
}

// Main function
async function main() {
  try {
    console.log('Reading configuration...');
    const themeInfo = readConfigFile();
    console.log('Theme info:', themeInfo);
    
    console.log('\nReading categories from config.template.js...');
    const categories = readCategories();
    console.log('Found categories:', categories);
    
    console.log('\nGenerating article configuration...');
    const articleConfig = await generateArticleConfig(themeInfo, categories);
    
    console.log(`\nGenerated ${articleConfig.articles.length} article topics`);
    console.log('Sample articles:');
    articleConfig.articles.slice(0, 3).forEach((article, i) => {
      console.log(`${i + 1}. ${article.topic} (${article.category})`);
    });
    
    console.log('\nUpdating config.template.js...');
    updateConfigTemplate(articleConfig);
    
    console.log('\n✅ Article configuration updated successfully!');
    console.log('Run "npm run sync-config-template" to sync changes to the website');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();