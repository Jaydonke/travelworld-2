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

  // Check if config.txt exists
  if (!fs.existsSync(configPath)) {
    throw new Error('config.txt not found. Please create a config.txt file with theme, domain, and siteName on separate lines.');
  }

  const content = fs.readFileSync(configPath, 'utf-8').trim();
  const lines = content.split('\n').map(line => line.trim());

  if (lines.length < 3 || !lines[0] || !lines[1] || !lines[2]) {
    throw new Error('config.txt must contain theme, domain, and siteName on separate lines.');
  }

  return {
    theme: lines[0],
    domain: lines[1],
    siteName: lines[2]
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

  // If extraction fails, throw error instead of using hardcoded defaults
  throw new Error('Could not extract categories from config.template.js. Please ensure CURRENT_WEBSITE_CONTENT.categories exists.');
}

// Define content distribution requirements
const CONTENT_DISTRIBUTION_REQUIREMENTS = {
  'Individual Reviews': { min: 5, max: 6, patterns: ['review of', 'review:', 'in-depth review', 'comprehensive review'] },
  'Curated Lists': { min: 4, max: 5, patterns: ['best', 'top', 'essential', 'must-watch', 'ultimate list'] },
  'Direct Comparisons': { min: 3, max: 4, patterns: ['vs', 'versus', 'compared', 'comparison', 'which is better'] },
  'How-to Guides': { min: 3, max: 4, patterns: ['how to', 'guide to', 'step-by-step', 'complete guide'] },
  'Beginner Guides': { min: 2, max: 3, patterns: ['beginner', 'getting started', 'introduction to', 'basics of'] },
  'Expert Strategies': { min: 2, max: 3, patterns: ['advanced', 'expert', 'professional', 'mastering', 'strategies'] },
  'Troubleshooting Guides': { min: 2, max: 2, patterns: ['troubleshooting', 'fix', 'solve', 'common problems'] },
  'Trend Analysis': { min: 2, max: 2, patterns: ['trends', 'future of', 'evolution', 'analysis', 'insights'] },
  'Deep-dive Explainers': { min: 1, max: 2, patterns: ['explained', 'understanding', 'deep dive', 'comprehensive analysis'] }
};

// Categorize article by its title
function categorizeArticle(title) {
  const titleLower = title.toLowerCase();

  for (const [category, config] of Object.entries(CONTENT_DISTRIBUTION_REQUIREMENTS)) {
    for (const pattern of config.patterns) {
      if (titleLower.includes(pattern)) {
        return category;
      }
    }
  }

  // Default to curated list if no pattern matches
  return 'Curated Lists';
}

// Validate content distribution
function validateContentDistribution(articles) {
  const distribution = {};
  const validation = {
    isValid: true,
    errors: [],
    suggestions: []
  };

  // Initialize distribution counts
  Object.keys(CONTENT_DISTRIBUTION_REQUIREMENTS).forEach(type => {
    distribution[type] = 0;
  });

  // Count current distribution
  articles.forEach(article => {
    const category = categorizeArticle(article.topic);
    distribution[category]++;
  });

  // Check against requirements
  Object.entries(CONTENT_DISTRIBUTION_REQUIREMENTS).forEach(([type, requirements]) => {
    const count = distribution[type];
    if (count < requirements.min) {
      validation.isValid = false;
      validation.errors.push(`${type}: Need ${requirements.min - count} more (has ${count}, needs ${requirements.min}-${requirements.max})`);
    } else if (count > requirements.max) {
      validation.isValid = false;
      validation.errors.push(`${type}: Too many by ${count - requirements.max} (has ${count}, max ${requirements.max})`);
    }
  });

  // Generate suggestions for improvement
  if (!validation.isValid) {
    validation.suggestions = generateDistributionSuggestions(distribution);
  }

  return { distribution, validation };
}

// Generate suggestions for improving distribution
function generateDistributionSuggestions(currentDistribution) {
  const suggestions = [];

  Object.entries(CONTENT_DISTRIBUTION_REQUIREMENTS).forEach(([type, requirements]) => {
    const count = currentDistribution[type];
    if (count < requirements.min) {
      const examples = getExampleTitles(type);
      suggestions.push(`Add ${requirements.min - count} more ${type}. Examples: ${examples.slice(0, 2).join(', ')}`);
    }
  });

  return suggestions;
}

// Get example titles for each content type
function getExampleTitles(contentType) {
  const examples = {
    'Individual Reviews': [
      'Netflix Streaming Service Review: Complete Analysis',
      'Spotify Premium Review: Features and Value',
      'iPhone Pro Review: Performance and Camera Quality'
    ],
    'Curated Lists': [
      'Best Streaming Platforms for Movie Lovers',
      'Top Action Movies You Must Watch',
      'Essential Sci-Fi Series for Beginners'
    ],
    'Direct Comparisons': [
      'Netflix vs Disney Plus: Which Streaming Service Wins',
      'Apple Music vs Spotify: Complete Comparison',
      'Action vs Drama Movies: Which Genre Rules'
    ],
    'How-to Guides': [
      'How to Choose the Perfect Streaming Service',
      'Complete Guide to Building Your Movie Collection',
      'Step-by-Step Guide to Home Theater Setup'
    ],
    'Beginner Guides': [
      'Beginner\'s Guide to Understanding Film Genres',
      'Getting Started with Streaming Services',
      'Introduction to Movie Rating Systems'
    ],
    'Expert Strategies': [
      'Advanced Techniques for Movie Discovery',
      'Professional Tips for Content Curation',
      'Expert Strategies for Entertainment Budget Management'
    ],
    'Troubleshooting Guides': [
      'Fixing Common Streaming Issues',
      'Troubleshooting Audio Problems in Movies',
      'Solving Buffering Issues: Complete Guide'
    ],
    'Trend Analysis': [
      'Future Trends in Streaming Entertainment',
      'Evolution of Movie Distribution Methods',
      'Emerging Patterns in Viewer Preferences'
    ],
    'Deep-dive Explainers': [
      'Understanding the Psychology of Entertainment Choices',
      'Movie Industry Economics Explained',
      'Comprehensive Analysis of Streaming Wars'
    ]
  };

  return examples[contentType] || [];
}

// Generate the prompt for articles and category info
function generatePrompt(themeInfo, categories) {
  const articleTemplate = {
    enabled: true,
    articles: []
  };

  const categoryInfoTemplate = {};

  // Example structures with actual categories
  const exampleArticle = {
    topic: "Example Article Title",
    keywords: ["primary keyword phrase", "long tail search query", "how to guide keywords", "specific topic keywords"],
    category: categories[0] // Use actual category from list
  };

  const exampleCategoryInfo = {
    [categories[0]]: {
      name: "Category Name",
      description: "Full description of the category and its scope.",
      shortDescription: "Brief one-line description.",
      icon: "📚",
      color: "#hex-color",
      aboutContent: "Content for the about section of this category.",
      detailedDescription: "Detailed description for SEO and category pages.",
      popularTopics: ["Topic 1", "Topic 2", "Topic 3"],
      seoKeywords: "comma, separated, keywords, for, seo",
      keywords: ["individual", "keyword", "array", "for", "tagging"]
    }
  };

  // Generate some example content types for guidance
  const contentTypeExamples = [
    "Movie Review: The Latest Blockbuster Analysis",
    "Best Streaming Services for Movie Lovers",
    "Netflix vs Disney Plus: Complete Comparison",
    "How to Build Your Movie Collection Guide",
    "Beginner's Guide to Understanding Film Genres",
    "Expert Tips for Music Discovery",
    "Troubleshooting Common Streaming Issues",
    "Future Trends in Entertainment Industry",
    "Understanding the Psychology of Fandom"
  ];

  return `You are an expert content strategist for ${themeInfo.theme} websites. Generate comprehensive article and category configurations for ${themeInfo.siteName} (${themeInfo.domain}).

THEME CONTEXT: ${themeInfo.theme}
CATEGORIES AVAILABLE: ${categories.join(', ')}

Your task is to create EXACTLY 25 high-quality article topics that will provide value to readers interested in ${themeInfo.theme}.

CONTENT REQUIREMENTS:
1. Create a diverse mix of content types that readers actually search for:
   - 5-6 Individual Reviews (e.g., "Netflix Review: Complete Service Analysis")
   - 4-5 Curated Lists (e.g., "Best Action Movies to Stream Right Now")
   - 3-4 How-to Guides (e.g., "How to Choose the Perfect Streaming Service")
   - 3-4 Comparisons (e.g., "Netflix vs Disney Plus: Which is Better")
   - 2-3 Beginner Guides (e.g., "Beginner's Guide to Understanding Film Genres")
   - 2-3 Expert Insights (e.g., "Expert Analysis of Streaming Industry Trends")
   - 1-2 Troubleshooting (e.g., "How to Fix Common Streaming Issues")
   - 1-2 Trend Analysis (e.g., "The Future of Entertainment Technology")

2. Article Title Guidelines:
   - Use natural, conversational titles that people would actually search for
   - Include action words and clear value propositions
   - Be specific rather than generic
   - Avoid clickbait but make titles compelling

3. Keyword Requirements (EXACTLY 4 per article):
   - Each keyword must be 2-4 words long (NO single words)
   - Focus on actual search queries people use
   - Include search intent words: "best", "how to", "guide", "review", "vs", "tips", "tutorial"
   - ABSOLUTELY NO year numbers or dates - use "latest", "current", "trending", "modern"
   - Keywords should be evergreen and timeless
   - Target both head terms and long-tail keywords

4. Category Distribution:
   - Distribute articles naturally across all ${categories.length} categories
   - Assign categories based on the main topic focus
   - Aim for 3-4 articles per category

RETURN FORMAT:
{
  "articleConfig": {
    "enabled": true,
    "articles": [
      {
        "topic": "Natural, searchable article title",
        "keywords": ["search term 1", "search term 2", "search term 3", "search term 4"],
        "category": "appropriate-category"
      }
      // ... exactly 25 articles total ...
    ]
  },
  "categoryInfo": {
    "${categories[0]}": {
      "name": "Category Display Name",
      "description": "Engaging description of what readers will find in this category",
      "shortDescription": "Brief one-line description",
      "icon": "📱",
      "color": "#vibrant-hex-color",
      "aboutContent": "Detailed about section content",
      "detailedDescription": "SEO-optimized detailed description",
      "popularTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "seoKeywords": "comma, separated, keywords",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
    // ... info for all ${categories.length} categories ...
  }
}

Remember:
- Create content that real people would search for and want to read
- Focus on providing value and solving problems
- Make titles and keywords natural, not keyword-stuffed
- EXACTLY 25 articles, no placeholders, all high-quality

Return ONLY valid JSON.`;
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

// Intelligently assign category based on article title and content type
function assignBestCategory(articleTitle, categories) {
  const titleLower = articleTitle.toLowerCase();

  // Map keywords to most likely categories
  const categoryMappings = {
    'movies': ['movie', 'film', 'cinema', 'blockbuster', 'theater'],
    'music': ['music', 'song', 'album', 'artist', 'band', 'concert', 'playlist'],
    'tv-shows': ['tv', 'series', 'show', 'episode', 'season', 'streaming', 'binge'],
    'celebrities': ['celebrity', 'star', 'actor', 'actress', 'famous', 'hollywood'],
    'pop-culture': ['pop culture', 'trend', 'viral', 'meme', 'social media', 'internet'],
    'reviews': ['review', 'rating', 'critique', 'analysis', 'opinion'],
    'news': ['news', 'latest', 'breaking', 'announcement', 'update'],
    'events': ['event', 'festival', 'awards', 'premiere', 'concert', 'tour']
  };

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (!categories.includes(category)) continue;

    for (const keyword of keywords) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }
  }

  // Default assignments based on content type patterns
  if (titleLower.includes('vs') || titleLower.includes('comparison')) {
    return categories.includes('reviews') ? 'reviews' : categories[0];
  }
  if (titleLower.includes('how to') || titleLower.includes('guide')) {
    return categories.includes('pop-culture') ? 'pop-culture' : categories[0];
  }
  if (titleLower.includes('best') || titleLower.includes('top')) {
    return categories.includes('reviews') ? 'reviews' : categories[0];
  }

  // If no match found, use the first available category
  return categories[0];
}

// Post-process articles to fix distribution if needed
function postProcessArticleDistribution(articles, categories, themeInfo) {
  const { distribution, validation } = validateContentDistribution(articles);

  if (validation.isValid) {
    console.log('✅ Content distribution is valid!');
    return articles;
  }

  console.log('⚠️ Post-processing articles to fix distribution...');
  console.log('Current distribution:', distribution);

  const processedArticles = [...articles];

  // First pass: Fix under-represented categories
  Object.entries(CONTENT_DISTRIBUTION_REQUIREMENTS).forEach(([neededType, requirements]) => {
    const currentCount = distribution[neededType] || 0;
    if (currentCount < requirements.min) {
      const needed = requirements.min - currentCount;
      console.log(`Need ${needed} more ${neededType} articles`);

      // Find articles from over-represented categories
      let converted = 0;
      for (let i = 0; i < processedArticles.length && converted < needed; i++) {
        const article = processedArticles[i];
        const currentType = categorizeArticle(article.topic);
        const currentReq = CONTENT_DISTRIBUTION_REQUIREMENTS[currentType];

        // Only convert if the source category has excess
        if (distribution[currentType] > currentReq.max ||
            (distribution[currentType] > currentReq.min && distribution[neededType] < requirements.min)) {
          // Convert this article to the needed type
          const oldTitle = article.topic;
          article.topic = convertArticleTitle(article.topic, neededType, themeInfo);
          article.category = assignBestCategory(article.topic, categories);
          console.log(`Converted: "${oldTitle}" -> "${article.topic}" (${currentType} -> ${neededType})`);

          distribution[currentType]--;
          distribution[neededType]++;
          converted++;
        }
      }
    }
  });

  // Second pass: Handle any remaining over-represented categories
  Object.entries(distribution).forEach(([type, count]) => {
    const req = CONTENT_DISTRIBUTION_REQUIREMENTS[type];
    if (count > req.max) {
      const excess = count - req.max;
      console.log(`${type} has ${excess} too many articles, redistributing...`);

      let fixed = 0;
      // Find under-represented types
      const underRepTypes = Object.entries(CONTENT_DISTRIBUTION_REQUIREMENTS)
        .filter(([t, r]) => (distribution[t] || 0) < r.max)
        .map(([t]) => t);

      for (let i = 0; i < processedArticles.length && fixed < excess; i++) {
        const article = processedArticles[i];
        if (categorizeArticle(article.topic) === type) {
          // Convert to an under-represented type
          const targetType = underRepTypes[fixed % underRepTypes.length];
          const oldTitle = article.topic;
          article.topic = convertArticleTitle(article.topic, targetType, themeInfo);
          article.category = assignBestCategory(article.topic, categories);
          console.log(`Redistributed: "${oldTitle}" -> "${article.topic}" (${type} -> ${targetType})`);

          distribution[type]--;
          distribution[targetType] = (distribution[targetType] || 0) + 1;
          fixed++;
        }
      }
    }
  });

  return processedArticles;
}

// Convert an article title to match a specific content type
function convertArticleTitle(originalTitle, targetType, themeInfo) {
  const baseTitle = originalTitle.replace(/^(Best|Top|How to|Review|Guide|Ultimate|Complete|Beginner's|Advanced|Expert|Professional|Troubleshooting|Future|Understanding|Deep Dive|Analysis)\s*/i, '');
  const examples = getExampleTitles(targetType);
  const patterns = CONTENT_DISTRIBUTION_REQUIREMENTS[targetType].patterns;

  // Use the first pattern to create a new title
  const pattern = patterns[0];

  switch (targetType) {
    case 'Individual Reviews':
      return `${baseTitle} Review: Complete Analysis`;
    case 'Curated Lists':
      return `Best ${baseTitle} You Must Know`;
    case 'Direct Comparisons':
      const parts = baseTitle.split(' ');
      if (parts.length >= 2) {
        return `${parts[0]} vs ${parts.slice(1).join(' ')}: Complete Comparison`;
      }
      return `${baseTitle} Comparison Guide`;
    case 'How-to Guides':
      return `How to Choose the Perfect ${baseTitle}`;
    case 'Beginner Guides':
      return `Beginner's Guide to ${baseTitle}`;
    case 'Expert Strategies':
      return `Expert Strategies for ${baseTitle}`;
    case 'Troubleshooting Guides':
      return `Troubleshooting Common ${baseTitle} Issues`;
    case 'Trend Analysis':
      return `Future Trends in ${baseTitle}`;
    case 'Deep-dive Explainers':
      return `Understanding ${baseTitle}: Deep Dive Analysis`;
    default:
      return originalTitle;
  }
}

// Generate configuration using GPT
async function generateConfigurations(themeInfo, categories) {
  try {
    console.log('\n🎯 Generating article and category configurations...');
    console.log('Theme:', themeInfo.theme);
    console.log('Categories:', categories);

    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a content strategist. Return ONLY valid JSON, no markdown, no explanations. Categories must be from the exact list provided."
        },
        {
          role: "user",
          content: generatePrompt(themeInfo, categories)
        }
      ],
      temperature: 0.7,
      max_tokens: 12000,
    });
    console.log('OpenAI API response received');

    const content = response.choices[0].message.content;
    const cleanedContent = cleanGPTResponse(content);

    // Parse and validate the JSON
    const result = JSON.parse(cleanedContent);

    // Validate structure
    if (!result.articleConfig || !result.categoryInfo) {
      throw new Error('Invalid response structure: missing articleConfig or categoryInfo');
    }

    // Validate articles
    if (!result.articleConfig.articles || !Array.isArray(result.articleConfig.articles)) {
      throw new Error('Invalid response structure: missing articles array');
    }

    if (result.articleConfig.articles.length !== 25) {
      console.warn(`Expected 25 articles, got ${result.articleConfig.articles.length}. Adjusting...`);
    }

    // Validate each article
    result.articleConfig.articles = result.articleConfig.articles.map((article, index) => {
      if (!article.topic || !article.keywords || !article.category) {
        throw new Error(`Article ${index + 1} missing required fields`);
      }

      // Ensure category is valid - use intelligent assignment if invalid
      if (!categories.includes(article.category)) {
        const bestCategory = assignBestCategory(article.topic, categories);
        console.warn(`Invalid category "${article.category}" for article "${article.topic}". Assigning best match: "${bestCategory}"`);
        article.category = bestCategory;
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
    while (result.articleConfig.articles.length < 25) {
      // Find the least used category
      const categoryCounts = {};
      categories.forEach(cat => categoryCounts[cat] = 0);
      result.articleConfig.articles.forEach(a => {
        if (categoryCounts[a.category] !== undefined) {
          categoryCounts[a.category]++;
        }
      });
      const leastUsedCategory = Object.entries(categoryCounts)
        .sort((a, b) => a[1] - b[1])[0][0];

      // Generate a generic topic based on theme
      const articleNum = result.articleConfig.articles.length + 1;
      result.articleConfig.articles.push({
        topic: `Essential Guide to ${themeInfo.theme} Trends`,
        keywords: [
          `${themeInfo.theme.toLowerCase()} trends`,
          "expert guide",
          "must know tips",
          "industry insights"
        ],
        category: leastUsedCategory
      });
    }

    if (result.articleConfig.articles.length > 25) {
      result.articleConfig.articles = result.articleConfig.articles.slice(0, 25);
    }

    // Show content distribution for reference (no validation)
    const { distribution } = validateContentDistribution(result.articleConfig.articles);

    console.log('\n📊 Content Distribution:');
    Object.entries(distribution).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} articles`);
    });

    // Validate category info
    for (const category of categories) {
      if (!result.categoryInfo[category]) {
        console.warn(`Missing category info for "${category}". Generating default...`);
        result.categoryInfo[category] = {
          name: category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          description: `Explore ${category} in the world of ${themeInfo.theme}.`,
          shortDescription: `All about ${category}.`,
          icon: "📂",
          color: "#666666",
          aboutContent: `Content related to ${category}.`,
          detailedDescription: `Detailed information about ${category} in ${themeInfo.theme}.`,
          popularTopics: ["Topic 1", "Topic 2", "Topic 3"],
          seoKeywords: `${category}, ${themeInfo.theme.toLowerCase()}, entertainment`,
          keywords: [category, themeInfo.theme.toLowerCase(), "entertainment"]
        };
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Error generating configurations:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

// Update config.template.js with new configurations
function updateConfigTemplate(articleConfig, categoryInfo) {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  
  // Create config-backups directory if it doesn't exist
  const backupDir = path.join(__dirname, '..', 'config-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup current file
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupPath = path.join(backupDir, `config.template.js.backup-full-${timestamp}.js`);
  fs.copyFileSync(configPath, backupPath);
  console.log(`Backup created: ${backupPath}`);
  
  // Read current config
  let content = fs.readFileSync(configPath, 'utf-8');
  
  // Update ARTICLE_GENERATION_CONFIG
  const newArticleConfig = `export const ARTICLE_GENERATION_CONFIG = ${JSON.stringify(articleConfig, null, 2)};`;
  
  // Replace ARTICLE_GENERATION_CONFIG section
  const articleStartMarker = 'export const ARTICLE_GENERATION_CONFIG = {';
  const articleStartIndex = content.indexOf(articleStartMarker);
  
  if (articleStartIndex === -1) {
    throw new Error('Could not find ARTICLE_GENERATION_CONFIG in config.template.js');
  }
  
  // Find the matching closing brace for ARTICLE_GENERATION_CONFIG
  let braceCount = 0;
  let articleEndIndex = articleStartIndex + articleStartMarker.length;
  let foundEnd = false;
  
  for (let i = articleEndIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      if (braceCount === 0) {
        // Check if this is followed by a semicolon
        let j = i + 1;
        while (j < content.length && /\s/.test(content[j])) j++;
        if (content[j] === ';') {
          articleEndIndex = j + 1;
        } else {
          articleEndIndex = i + 1;
        }
        foundEnd = true;
        break;
      }
      braceCount--;
    }
  }
  
  if (!foundEnd) {
    throw new Error('Could not find end of ARTICLE_GENERATION_CONFIG');
  }
  
  // Replace the ARTICLE_GENERATION_CONFIG section
  content = content.substring(0, articleStartIndex) + newArticleConfig + content.substring(articleEndIndex);
  
  // Update CATEGORY_INFO
  const newCategoryInfo = `export const CATEGORY_INFO = ${JSON.stringify(categoryInfo, null, 2)};`;
  
  // Find and replace CATEGORY_INFO section
  const categoryStartMarker = 'export const CATEGORY_INFO = {';
  const categoryStartIndex = content.indexOf(categoryStartMarker);
  
  if (categoryStartIndex === -1) {
    // If CATEGORY_INFO doesn't exist, add it after CURRENT_SOCIAL_LINKS
    const socialLinksEnd = content.indexOf('export const CURRENT_SOCIAL_LINKS');
    if (socialLinksEnd !== -1) {
      // Find the end of CURRENT_SOCIAL_LINKS
      let socialEndIndex = content.indexOf('];', socialLinksEnd) + 2;
      while (socialEndIndex < content.length && /\s/.test(content[socialEndIndex])) socialEndIndex++;
      if (content[socialEndIndex] === ';') socialEndIndex++;
      
      content = content.substring(0, socialEndIndex) + '\n\n// Category metadata\n' + newCategoryInfo + content.substring(socialEndIndex);
    }
  } else {
    // Find the matching closing brace for CATEGORY_INFO
    braceCount = 0;
    let categoryEndIndex = categoryStartIndex + categoryStartMarker.length;
    foundEnd = false;
    
    for (let i = categoryEndIndex; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        if (braceCount === 0) {
          // Check if this is followed by a semicolon
          let j = i + 1;
          while (j < content.length && /\s/.test(content[j])) j++;
          if (content[j] === ';') {
            categoryEndIndex = j + 1;
          } else {
            categoryEndIndex = i + 1;
          }
          foundEnd = true;
          break;
        }
        braceCount--;
      }
    }
    
    if (!foundEnd) {
      throw new Error('Could not find end of CATEGORY_INFO');
    }
    
    // Replace the CATEGORY_INFO section
    content = content.substring(0, categoryStartIndex) + newCategoryInfo + content.substring(categoryEndIndex);
  }
  
  // Write updated config
  fs.writeFileSync(configPath, content, 'utf-8');
  console.log('config.template.js updated with new configurations');
}

// Limit articles to maximum 25 in config file
function limitArticlesToMax25() {
  const configPath = path.join(__dirname, '..', 'config.template.js');
  let content = fs.readFileSync(configPath, 'utf-8');
  
  // Find ARTICLE_GENERATION_CONFIG section
  const startMarker = 'export const ARTICLE_GENERATION_CONFIG = {';
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.log('ARTICLE_GENERATION_CONFIG not found, skipping article limit check');
    return;
  }
  
  // Extract the current configuration
  let braceCount = 0;
  let endIndex = startIndex + startMarker.length;
  let foundEnd = false;
  
  for (let i = endIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      if (braceCount === 0) {
        let j = i + 1;
        while (j < content.length && /\s/.test(content[j])) j++;
        if (content[j] === ';') {
          endIndex = j + 1;
        } else {
          endIndex = i + 1;
        }
        foundEnd = true;
        break;
      }
      braceCount--;
    }
  }
  
  if (!foundEnd) {
    console.log('Could not find end of ARTICLE_GENERATION_CONFIG, skipping article limit check');
    return;
  }
  
  // Extract and parse the config
  const configText = content.substring(startIndex + startMarker.length - 1, endIndex - (content[endIndex-1] === ';' ? 1 : 0));
  
  try {
    const config = JSON.parse(configText);
    
    if (!config.articles || !Array.isArray(config.articles)) {
      console.log('No articles array found in config');
      return;
    }
    
    const currentCount = config.articles.length;
    console.log(`Current articles count: ${currentCount}`);
    
    if (currentCount > 25) {
      console.log(`Trimming articles from ${currentCount} to 25...`);
      
      // Keep only first 25 articles
      config.articles = config.articles.slice(0, 25);
      
      // Recreate the config section
      const newConfigSection = `export const ARTICLE_GENERATION_CONFIG = ${JSON.stringify(config, null, 2)};`;
      
      // Replace in content
      content = content.substring(0, startIndex) + newConfigSection + content.substring(endIndex);
      
      // Write back to file
      fs.writeFileSync(configPath, content, 'utf-8');
      console.log(`✅ Articles limited to 25 (was ${currentCount})`);
    } else {
      console.log(`Articles count (${currentCount}) is within limit, no changes needed`);
    }
    
  } catch (error) {
    console.log('Error parsing config for article limit check:', error.message);
  }
}

// Reset position tracking to allow regeneration of all articles
function resetPositionTracking() {
  const trackingPath = path.join(__dirname, '..', '.article-fingerprints.json');
  
  try {
    let originalCount = 0;
    
    if (fs.existsSync(trackingPath)) {
      // Read current tracking data to get count
      try {
        const content = fs.readFileSync(trackingPath, 'utf-8');
        const trackingData = JSON.parse(content);
        
        if (trackingData.processedPositions !== undefined) {
          originalCount = trackingData.processedPositions.length;
        } else if (trackingData.fingerprints) {
          originalCount = Object.keys(trackingData.fingerprints).length;
        }
      } catch (parseError) {
        console.log('Note: Existing tracking file was corrupted, will be reset');
      }
      
      // Always delete the file for complete reset
      fs.unlinkSync(trackingPath);
    }
    
    if (originalCount > 0) {
      console.log(`✅ Position tracking reset successfully (cleared ${originalCount} processed positions)`);
    } else {
      console.log('✅ Position tracking reset successfully (file was empty or non-existent)');
    }
    
  } catch (error) {
    console.log(`⚠️ Error resetting position tracking: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Content Generation with Distribution Enforcement');
    console.log('===========================================================');

    console.log('\n📖 Reading configuration...');
    const themeInfo = readConfigFile();
    console.log('Theme info:', themeInfo);

    console.log('\n📂 Reading categories from config.template.js...');
    const categories = readCategories();
    console.log('Found categories:', categories);

    const { articleConfig, categoryInfo } = await generateConfigurations(themeInfo, categories);

    // Display distribution for information only
    const { distribution } = validateContentDistribution(articleConfig.articles);

    console.log('\n📊 CONTENT DISTRIBUTION SUMMARY:');
    console.log('=====================================');
    Object.entries(distribution).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type.padEnd(25)}: ${count.toString().padStart(2)} articles`);
      }
    });

    console.log(`\n📝 Generated ${articleConfig.articles.length} article topics`);
    console.log('\n📑 Sample articles by type:');

    // Group articles by type for display
    const articlesByType = {};
    articleConfig.articles.forEach(article => {
      const type = categorizeArticle(article.topic);
      if (!articlesByType[type]) articlesByType[type] = [];
      articlesByType[type].push(article);
    });

    Object.entries(articlesByType).forEach(([type, articles]) => {
      console.log(`\n  ${type} (${articles.length}):`);
      articles.slice(0, 2).forEach((article, i) => {
        console.log(`    ${i + 1}. ${article.topic} (${article.category})`);
      });
      if (articles.length > 2) {
        console.log(`    ... and ${articles.length - 2} more`);
      }
    });

    console.log(`\n🏷️ Generated info for ${Object.keys(categoryInfo).length} categories`);
    console.log('Categories with info:', Object.keys(categoryInfo));

    console.log('\n💾 Updating config.template.js...');
    updateConfigTemplate(articleConfig, categoryInfo);

    console.log('\n🔍 Checking and limiting articles to maximum 25...');
    limitArticlesToMax25();

    console.log('\n🔄 Resetting position tracking to allow regeneration...');
    resetPositionTracking();

    console.log('\n✅ ARTICLE AND CATEGORY CONFIGURATIONS UPDATED SUCCESSFULLY!');
    console.log('===========================================================');
    console.log('📋 Summary:');
    console.log(`   • ${articleConfig.articles.length} articles generated`);
    console.log(`   • ${Object.keys(categoryInfo).length} categories configured`);
    console.log('\n🔧 Next steps:');
    console.log('   1. Run "npm run sync-config-template" to sync changes to the website');
    console.log('   2. 💡 All articles will be regenerated on next run due to position tracking reset');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    console.error('\n🔍 Troubleshooting tips:');
    console.error('   • Check your OpenAI API key is valid');
    console.error('   • Ensure config.txt exists with theme, domain, and siteName');
    console.error('   • Verify config.template.js has valid categories array');
    process.exit(1);
  }
}

main();