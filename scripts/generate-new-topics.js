/**
 * Generate New Article Topics Script
 * 
 * This script generates new article topics that don't duplicate existing ones.
 * Updated to read from config.txt and ARTICLE_GENERATION_CONFIG
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import crypto from 'crypto';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Color output functions
const log = (msg, color = 'white') => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color] || colors.white}${msg}${colors.reset}`);
};

// Configuration
const CONFIG_TXT_PATH = path.join(__dirname, '..', 'config.txt');
const CONFIG_PATH = path.join(__dirname, '..', 'config.template.js');
const FINGERPRINTS_PATH = path.join(__dirname, '..', '.article-fingerprints.json');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

/**
 * Generate topic fingerprint for comparison
 */
function generateTopicFingerprint(topic) {
  const normalized = topic
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return crypto.createHash('md5').update(normalized).digest('hex').slice(0, 12);
}

/**
 * Load configuration from config.txt
 */
function loadConfigFromTxt() {
  try {
    if (!fs.existsSync(CONFIG_TXT_PATH)) {
      throw new Error('config.txt not found');
    }
    
    const content = fs.readFileSync(CONFIG_TXT_PATH, 'utf-8').trim();
    const lines = content.split('\n').map(line => line.trim());
    
    return {
      theme: lines[0] || 'Entertainment & Pop Culture',
      domain: lines[1] || 'Popzic.com',
      siteName: lines[2] || 'PopZic'
    };
  } catch (error) {
    log(`❌ Error loading config.txt: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Load ARTICLE_GENERATION_CONFIG and CURRENT_WEBSITE_CONTENT from config.template.js
 */
async function loadArticleConfig() {
  try {
    // Dynamically import the config module
    const configModule = await import('../config.template.js');
    
    // Get both configurations
    const articleConfig = configModule.ARTICLE_GENERATION_CONFIG;
    const websiteContent = configModule.CURRENT_WEBSITE_CONTENT;
    
    if (!articleConfig) {
      throw new Error('ARTICLE_GENERATION_CONFIG not found in config.template.js');
    }
    
    if (!websiteContent) {
      throw new Error('CURRENT_WEBSITE_CONTENT not found in config.template.js');
    }
    
    // Get categories from CURRENT_WEBSITE_CONTENT
    const categories = websiteContent.categories || [];
    if (categories.length === 0) {
      log('⚠️ Warning: No categories found in CURRENT_WEBSITE_CONTENT', 'yellow');
      log('  Using default categories as fallback', 'yellow');
      // Fallback categories if none found
      return {
        articles: articleConfig.articles || [],
        categories: ['general', 'news', 'guides', 'tutorials', 'reviews']
      };
    }
    
    return {
      articles: articleConfig.articles || [],
      categories: categories
    };
  } catch (error) {
    log(`❌ Error loading config: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Load existing fingerprints
 */
function loadFingerprints() {
  try {
    if (fs.existsSync(FINGERPRINTS_PATH)) {
      const content = fs.readFileSync(FINGERPRINTS_PATH, 'utf-8');
      return JSON.parse(content);
    }
    return { fingerprints: {} };
  } catch (error) {
    log(`⚠️ Warning: Could not load fingerprints: ${error.message}`, 'yellow');
    return { fingerprints: {} };
  }
}

/**
 * Extract existing topics from articles and fingerprints
 */
function getExistingTopics(articles, fingerprints) {
  const topics = new Set();
  
  // Add topics from ARTICLE_GENERATION_CONFIG
  if (articles && Array.isArray(articles)) {
    articles.forEach(article => {
      topics.add(article.topic.toLowerCase());
    });
  }
  
  // Add topics from fingerprints
  Object.values(fingerprints.fingerprints || {}).forEach(record => {
    if (record.originalTopic) {
      topics.add(record.originalTopic.toLowerCase());
    }
  });
  
  return topics;
}

/**
 * Generate new topics using GPT
 */
async function generateNewTopics(siteInfo, categories, existingTopics, count = 15) {
  log(`\n🤖 Generating ${count} new article topics...`, 'cyan');

  const { theme, domain, siteName } = siteInfo;

  // Build existing topics list for context
  const existingTopicsList = Array.from(existingTopics).slice(-20).join('\n');

  const prompt = `You are an expert content strategist for ${siteName} (${domain}) - a ${theme} website.

Your task is to generate EXACTLY ${count} high-quality, engaging article topics that readers actually search for and share.

AVAILABLE CATEGORIES (use exact lowercase-hyphen format):
${categories.map(cat => `- ${cat}`).join('\n')}

AVOID THESE EXISTING TOPICS (create completely different content):
${existingTopicsList}

CONTENT REQUIREMENTS:
Create a diverse mix of content types that readers actually search for:
- Individual Reviews (specific products/services/shows/albums)
- Curated Lists (Top 10s, Best of lists with clear criteria)
- How-to Guides (step-by-step instructions for specific tasks)
- Beginner's Guides (comprehensive introductions to topics)
- Comparisons (versus articles, head-to-head comparisons)
- Expert Analysis (trends, evolution, impact pieces)
- Problem-solving Content (troubleshooting, tips, solutions)
- Discovery Content (hidden gems, underrated items, new finds)
- Event Coverage (festivals, releases, premieres)
- Educational Content (explanations, breakdowns, insights)

KEYWORD REQUIREMENTS:
For each article, provide 4 keywords that:
- Are 2-4 words long (no single words)
- Are evergreen and timeless (NO year numbers like 2023, 2024)
- Target actual search queries people use
- Include search intent words naturally
- Are specific to the article topic

Good keyword examples:
- "best streaming services"
- "movie review guide"
- "how to watch classics"
- "music festival tips"
- "celebrity fashion trends"

Bad keywords (NEVER use):
- Single words: "movies", "music", "celebrities"
- Year-specific: "best movies 2024", "trends 2023"
- Too generic: "latest", "new", "trending"
- Too broad: "entertainment news", "pop culture"

TITLE REQUIREMENTS:
- Clear and specific (reader knows exactly what they'll get)
- Include primary benefit or value proposition
- Natural language that people actually search for
- Mix different angles: reviews, lists, guides, how-tos, comparisons

FORMAT YOUR RESPONSE:
Return EXACTLY ${count} topics as a JSON array:
[
  {
    "topic": "Clear, Specific Article Title",
    "category": "exact-category-from-list",
    "keywords": ["keyword phrase one", "keyword phrase two", "keyword phrase three", "keyword phrase four"]
  }
]

CRITICAL Requirements:
- Generate EXACTLY ${count} complete article topics
- ABSOLUTELY NO year numbers in titles OR keywords
- Use ONLY the provided categories (exact format)
- Each topic must be unique and different from existing ones
- Ensure natural distribution across categories
- Keywords must be timeless and evergreen`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist specializing in creating engaging, SEO-optimized article topics. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 8000
    });

    const content = response.choices[0].message.content;
    
    // Parse the response
    let topics;
    try {
      // Clean the response (remove markdown if present)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      topics = JSON.parse(cleanContent);
    } catch (parseError) {
      log('⚠️ Failed to parse GPT response, attempting to extract JSON...', 'yellow');
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract valid JSON from GPT response');
      }
    }

    // Validate topics
    if (!Array.isArray(topics)) {
      throw new Error('GPT response is not an array');
    }

    // Filter and validate each topic
    const validTopics = topics.filter(topic => {
      if (!topic.topic || !topic.category || !topic.keywords) {
        log(`⚠️ Skipping invalid topic: ${JSON.stringify(topic)}`, 'yellow');
        return false;
      }

      // Ensure exactly 4 keywords
      if (!Array.isArray(topic.keywords) || topic.keywords.length !== 4) {
        log(`⚠️ Topic must have exactly 4 keywords: ${topic.topic}`, 'yellow');
        // Try to fix it
        if (Array.isArray(topic.keywords)) {
          if (topic.keywords.length > 4) {
            topic.keywords = topic.keywords.slice(0, 4);
          } else if (topic.keywords.length === 3) {
            // Add a generic keyword if we have 3
            topic.keywords.push(`${topic.category} content`);
          } else {
            return false;
          }
        } else {
          return false;
        }
      }

      // Check if category is valid
      if (!categories.includes(topic.category)) {
        log(`⚠️ Invalid category "${topic.category}" for topic "${topic.topic}"`, 'yellow');
        return false;
      }

      // Check for duplicates
      const fingerprint = generateTopicFingerprint(topic.topic);
      if (existingTopics.has(topic.topic.toLowerCase())) {
        log(`⚠️ Skipping duplicate topic: ${topic.topic}`, 'yellow');
        return false;
      }

      return true;
    });

    log(`  ✅ Generated ${validTopics.length} valid topics`, 'green');
    
    return validTopics;
  } catch (error) {
    log(`❌ Error generating topics: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Format topics for config file
 */
function formatTopicsForConfig(topics) {
  const formatted = topics.map(topic => {
    return `    {
      "topic": "${topic.topic}",
      "keywords": [
        ${topic.keywords.map(k => `"${k}"`).join(',\n        ')}
      ],
      "category": "${topic.category}"
    }`;
  }).join(',\n');
  
  return formatted;
}

/**
 * Save topics to file
 */
function saveTopicsToFile(topics, outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  // Create new-topics directory if it doesn't exist
  const newTopicsDir = path.join(__dirname, '..', 'new-topics');
  if (!fs.existsSync(newTopicsDir)) {
    fs.mkdirSync(newTopicsDir, { recursive: true });
  }
  
  // Determine filename - if outputPath is provided and doesn't include directory, put it in new-topics
  let filename;
  if (outputPath) {
    if (outputPath.includes(path.sep)) {
      // outputPath includes directory, use as is
      filename = outputPath;
    } else {
      // outputPath is just filename, put it in new-topics directory
      filename = path.join(newTopicsDir, outputPath);
    }
  } else {
    // Default filename in new-topics directory
    filename = path.join(newTopicsDir, `new-topics-${timestamp}.js`);
  }
  
  const content = `// Generated Article Topics - ${new Date().toISOString()}
// Add these to your config.template.js ARTICLE_GENERATION_CONFIG.articles array

const newArticles = [
${formatTopicsForConfig(topics)}
];

export default newArticles;

/* 
To add these to config.template.js:
1. Open config.template.js
2. Find ARTICLE_GENERATION_CONFIG
3. Locate the 'articles' array
4. Add these topics to the end of the array
5. Run: npm run generate-articles -s -c ${topics.length}
*/`;

  fs.writeFileSync(filename, content);
  log(`\n💾 Topics saved to: ${filename}`, 'green');
  return filename;
}

/**
 * Main function
 */
async function main() {
  try {
    log('\n' + '='.repeat(40), 'bold');
    log('     📝 NEW TOPICS GENERATOR', 'bold');
    log('='.repeat(40), 'bold');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '15');
    const output = args.find(arg => arg.startsWith('--output='))?.split('=')[1];
    const skipAdd = args.includes('--no-add') || args.includes('-n');
    const help = args.includes('--help') || args.includes('-h');
    
    if (help) {
      log('\nUsage: node generate-new-topics.js [options]', 'cyan');
      log('\nOptions:', 'yellow');
      log('  --count=N       Number of topics to generate (default: 15)', 'white');
      log('  --output=FILE   Output filename (default: new-topics-[timestamp].js)', 'white');
      log('  --no-add, -n    Skip automatic addition to config.template.js', 'white');
      log('  --help, -h      Show this help message', 'white');
      log('\nExample:', 'yellow');
      log('  node generate-new-topics.js --count=20', 'white');
      log('  node generate-new-topics.js --output=my-new-topics.js', 'white');
      log('  node generate-new-topics.js --count=5 --no-add', 'white');
      return;
    }
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in .env file');
    }
    
    // Load configuration from config.txt
    log('\n📚 Loading configuration from config.txt...', 'cyan');
    const siteInfo = loadConfigFromTxt();
    log(`  Theme: ${siteInfo.theme}`, 'gray');
    log(`  Domain: ${siteInfo.domain}`, 'gray');
    log(`  Site Name: ${siteInfo.siteName}`, 'gray');
    
    // Load article configuration
    log('\n📂 Loading article configuration...', 'cyan');
    const { articles, categories } = await loadArticleConfig();
    log(`  Found ${categories.length} categories: ${categories.slice(0, 3).join(', ')}...`, 'gray');
    log(`  Found ${articles.length} existing articles`, 'gray');
    
    // Load existing fingerprints
    log('\n🔍 Loading fingerprints...', 'cyan');
    const fingerprints = loadFingerprints();
    const existingTopics = getExistingTopics(articles, fingerprints);
    log(`  Total unique topics found: ${existingTopics.size}`, 'gray');
    
    // Generate new topics
    const newTopics = await generateNewTopics(siteInfo, categories, existingTopics, count);
    
    if (newTopics.length === 0) {
      log('\n⚠️ No new topics were generated', 'yellow');
      return;
    }
    
    // Display generated topics
    log('\n📋 Generated Topics:', 'cyan');
    newTopics.forEach((topic, index) => {
      log(`\n  ${index + 1}. ${topic.topic}`, 'white');
      log(`     Category: ${topic.category}`, 'gray');
      log(`     Keywords: ${topic.keywords.join(', ')}`, 'gray');
    });
    
    // Save to file
    const savedFile = saveTopicsToFile(newTopics, output);
    
    // Auto-add to config
    if (!skipAdd) {
      log('\n🔧 Adding topics to config.template.js...', 'cyan');
      
      try {
        // Import the improved add-topics-to-config functionality
        const { addTopics } = await import('./add-topics-to-config-improved.js');
        const success = await addTopics(newTopics);
        
        if (success) {
          log('✅ Topics successfully added to ARTICLE_GENERATION_CONFIG!', 'green');
        } else {
          log('⚠️ Failed to add topics automatically', 'yellow');
          log('  Please add manually from the generated file', 'yellow');
        }
      } catch (error) {
        log(`⚠️ Could not auto-add topics: ${error.message}`, 'yellow');
        log('  Please add manually from the generated file', 'yellow');
      }
    }
    
    // Instructions
    log('\n✨ Next Steps:', 'yellow');
    if (skipAdd) {
      log('  1. Copy topics from generated file', 'white');
      log('  2. Add to ARTICLE_GENERATION_CONFIG.articles in config.template.js', 'white');
      log('  3. Run: npm run generate-articles', 'cyan');
    } else {
      log('  1. Topics have been added to config.template.js', 'white');
      log('  2. Run: npm run generate-articles', 'cyan');
    }
    log('  3. Run: npm run add-articles-improved', 'cyan');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    if (error.message.includes('OPENAI_API_KEY')) {
      log('\n💡 Setup Instructions:', 'yellow');
      log('   1. Create a .env file in the project root', 'yellow');
      log('   2. Add: OPENAI_API_KEY=your-api-key-here', 'yellow');
      log('   3. Get your API key from: https://platform.openai.com/api-keys', 'yellow');
    }
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Uncaught error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});