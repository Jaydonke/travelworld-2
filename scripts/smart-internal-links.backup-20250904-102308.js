#!/usr/bin/env node

/**
 * Smart Internal Link System v3.0 - Theme-Agnostic Edition
 * 
 * Features:
 * 1. Dynamic keyword extraction from configuration
 * 2. Theme-agnostic phrase detection
 * 3. Multi-source keyword integration
 * 4. Smart relevance matching
 * 5. SEO-optimized internal linking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  articlesDir: path.join(__dirname, '../src/content/articles'),
  blogDir: path.join(__dirname, '../src/content/blog'),
  dataBlogDir: path.join(__dirname, '../src/content/blog'),
  maxLinksPerArticle: 3,
  minPhraseQuality: 70,
  linkHistoryFile: path.join(__dirname, '../.link-history.json'),
  // Theme-agnostic configuration
  minKeywordLength: 3,
  maxPhraseWords: 4,
  keywordCacheTimeout: 3600000 // 1 hour
};

// Color output utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Theme-agnostic Keyword Extractor
 * Dynamically extracts keywords from configuration without hardcoding
 */
class KeywordExtractor {
  constructor() {
    this.keywordCache = null;
    this.cacheTimestamp = 0;
    this.stopWords = this.loadStopWords();
  }

  loadStopWords() {
    return new Set([
      // Articles & Determiners
      'a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any',
      // Prepositions
      'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'to', 'with', 
      'without', 'over', 'under', 'about', 'through', 'during', 'before', 
      'after', 'above', 'below', 'between', 'among',
      // Conjunctions
      'and', 'or', 'but', 'nor', 'so', 'yet', 'as', 'because', 'since', 
      'unless', 'although', 'while', 'if', 'when', 'where', 'whether',
      // Pronouns
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'our',
      'my', 'your', 'his', 'her', 'its', 'me', 'him', 'us',
      // Common Verbs
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 
      'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 
      'would', 'shall', 'should', 'could', 'can', 'may', 'might', 'must',
      'get', 'got', 'getting', 'make', 'made', 'making', 'take', 'took',
      'come', 'came', 'go', 'went', 'give', 'gave',
      // Common Adverbs & Adjectives
      'very', 'really', 'quite', 'just', 'only', 'even', 'also', 'too',
      'either', 'neither', 'more', 'less', 'most', 'least', 'much', 
      'many', 'few', 'little', 'all', 'no', 'not', 'none', 'each', 
      'every', 'both', 'several', 'such',
      // Other Common Words
      'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
      'yes', 'no', 'maybe', 'perhaps', 'please', 'thank', 'thanks',
      // Web/Content Words to Exclude
      'click', 'read', 'learn', 'find', 'see', 'know', 'think', 'say', 
      'said', 'tell', 'told', 'show', 'shown', 'view', 'page', 'site',
      'website', 'article', 'post', 'blog', 'content'
    ]);
  }

  /**
   * Load and merge keywords from all configuration sources
   */
  async loadThemeKeywords(forceReload = false) {
    const now = Date.now();
    
    // Use cache if valid
    if (!forceReload && this.keywordCache && 
        (now - this.cacheTimestamp) < CONFIG.keywordCacheTimeout) {
      return this.keywordCache;
    }

    const templatePath = path.join(__dirname, '../config.template.js');
    
    try {
      // Dynamic import with cache busting
      const configUrl = `file:///${templatePath.replace(/\\/g, '/')}?t=${now}`;
      const config = await import(configUrl);
      
      const { CATEGORY_INFO, ARTICLE_GENERATION_CONFIG } = config;
      
      const keywords = {
        byCategory: {},
        allKeywords: new Set(),
        articleKeywords: new Map(),
        compoundPatterns: []
      };

      // Extract keywords from CATEGORY_INFO
      if (CATEGORY_INFO) {
        for (const [category, info] of Object.entries(CATEGORY_INFO)) {
          if (info.keywords && Array.isArray(info.keywords)) {
            keywords.byCategory[category] = new Set(
              info.keywords.map(k => k.toLowerCase())
            );
            info.keywords.forEach(k => keywords.allKeywords.add(k.toLowerCase()));
          }
        }
      }

      // Extract keywords from ARTICLE_GENERATION_CONFIG
      if (ARTICLE_GENERATION_CONFIG?.articles) {
        ARTICLE_GENERATION_CONFIG.articles.forEach(article => {
          if (article.keywords && Array.isArray(article.keywords)) {
            // Store article-specific keywords
            const normalizedKeywords = article.keywords.map(k => k.toLowerCase());
            keywords.articleKeywords.set(
              article.topic.toLowerCase(), 
              normalizedKeywords
            );
            normalizedKeywords.forEach(k => keywords.allKeywords.add(k));
          }
        });
      }

      // Generate compound patterns from multi-word keywords
      keywords.allKeywords.forEach(keyword => {
        if (keyword.includes(' ')) {
          keywords.compoundPatterns.push({
            pattern: keyword,
            words: keyword.split(/\s+/)
          });
        }
      });

      // Sort compound patterns by length (longer first) for better matching
      keywords.compoundPatterns.sort((a, b) => b.words.length - a.words.length);

      this.keywordCache = keywords;
      this.cacheTimestamp = now;
      
      return keywords;
    } catch (error) {
      log(`⚠️ Failed to load theme keywords: ${error.message}`, 'yellow');
      return {
        byCategory: {},
        allKeywords: new Set(),
        articleKeywords: new Map(),
        compoundPatterns: []
      };
    }
  }

  /**
   * Extract domain-specific terms from content using loaded keywords
   */
  async extractDomainTerms(content, category = null) {
    const keywords = await this.loadThemeKeywords();
    const terms = new Set();
    
    // Clean content
    const cleanContent = content
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Extract compound patterns first (multi-word keywords)
    keywords.compoundPatterns.forEach(({ pattern }) => {
      if (cleanContent.includes(pattern)) {
        terms.add(pattern);
      }
    });

    // Extract single keywords
    const words = cleanContent.split(/\s+/);
    const categoryKeywords = category ? keywords.byCategory[category.toLowerCase()] : null;
    
    words.forEach(word => {
      if (word.length >= CONFIG.minKeywordLength && !this.stopWords.has(word)) {
        // Check if word is in theme keywords
        if (keywords.allKeywords.has(word)) {
          terms.add(word);
        }
        // Check category-specific keywords
        else if (categoryKeywords && categoryKeywords.has(word)) {
          terms.add(word);
        }
        // Check if word is part of any compound pattern
        else {
          keywords.compoundPatterns.forEach(({ words: patternWords }) => {
            if (patternWords.includes(word)) {
              terms.add(word);
            }
          });
        }
      }
    });

    return Array.from(terms);
  }

  /**
   * Check if a word is a stop word
   */
  isStopWord(word) {
    return this.stopWords.has(word.toLowerCase());
  }
}

/**
 * Theme-agnostic Phrase Builder
 * Constructs meaningful phrases from content and keywords
 */
class PhraseBuilder {
  constructor(keywordExtractor) {
    this.extractor = keywordExtractor;
  }

  /**
   * Build phrases from content using dynamic keyword detection
   */
  async buildPhrases(content, title, category) {
    const phrases = new Set();
    
    // Remove frontmatter and clean content
    const cleanContent = this.cleanContent(content);
    const sentences = this.splitIntoSentences(cleanContent);
    
    // Get theme keywords
    const keywords = await this.extractor.loadThemeKeywords();
    const domainTerms = await this.extractor.extractDomainTerms(cleanContent, category);
    
    // Extract phrases from sentences
    for (const sentence of sentences) {
      const sentencePhrases = await this.extractPhrasesFromSentence(
        sentence, 
        domainTerms, 
        keywords
      );
      sentencePhrases.forEach(p => phrases.add(p));
    }

    // Extract phrases from title
    const titlePhrases = await this.extractPhrasesFromTitle(title, keywords);
    titlePhrases.forEach(p => phrases.add(p));

    // Filter and rank phrases
    const rankedPhrases = this.rankPhrases(Array.from(phrases), keywords, domainTerms);
    
    return rankedPhrases.slice(0, 20); // Return top 20 phrases
  }

  cleanContent(content) {
    return content
      .replace(/^---[\s\S]*?---\n/, '') // Remove frontmatter
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
      .replace(/![^[]*\[[^\]]*\]\([^)]+\)/g, '') // Remove images
      .replace(/^#+\s+/gm, '') // Remove heading markers
      .replace(/[*_~]/g, '') // Remove formatting
      .replace(/\n+/g, ' ') // Normalize whitespace
      .trim();
  }

  splitIntoSentences(text) {
    // Split on sentence boundaries, keeping some context
    return text.match(/[^.!?]+[.!?]+/g) || [];
  }

  async extractPhrasesFromSentence(sentence, domainTerms, keywords) {
    const phrases = new Set();
    const words = sentence.toLowerCase().trim().split(/\s+/);
    
    // Look for domain terms in the sentence
    for (const term of domainTerms) {
      const termWords = term.split(/\s+/);
      
      // Find term position in sentence
      for (let i = 0; i <= words.length - termWords.length; i++) {
        let match = true;
        for (let j = 0; j < termWords.length; j++) {
          if (!words[i + j]?.includes(termWords[j])) {
            match = false;
            break;
          }
        }
        
        if (match) {
          // Add the term itself
          phrases.add(term);
          
          // Try to build expanded phrases
          this.buildExpandedPhrases(words, i, termWords.length, phrases);
        }
      }
    }

    // Look for compound patterns
    for (const { pattern } of keywords.compoundPatterns) {
      if (sentence.toLowerCase().includes(pattern)) {
        phrases.add(pattern);
      }
    }

    return Array.from(phrases);
  }

  buildExpandedPhrases(words, termIndex, termLength, phrases) {
    // Build 2-4 word phrases including the term
    const maxExpansion = Math.min(CONFIG.maxPhraseWords - termLength, 2);
    
    // Try adding words before
    for (let before = 1; before <= maxExpansion && termIndex - before >= 0; before++) {
      if (!this.extractor.isStopWord(words[termIndex - before])) {
        const phrase = words.slice(termIndex - before, termIndex + termLength).join(' ');
        if (this.isValidPhrase(phrase)) {
          phrases.add(phrase);
        }
      }
    }
    
    // Try adding words after
    for (let after = 1; after <= maxExpansion && termIndex + termLength + after <= words.length; after++) {
      if (!this.extractor.isStopWord(words[termIndex + termLength + after - 1])) {
        const phrase = words.slice(termIndex, termIndex + termLength + after).join(' ');
        if (this.isValidPhrase(phrase)) {
          phrases.add(phrase);
        }
      }
    }
    
    // Try adding words both before and after
    if (termIndex > 0 && termIndex + termLength < words.length) {
      const before = words[termIndex - 1];
      const after = words[termIndex + termLength];
      
      if (!this.extractor.isStopWord(before) && !this.extractor.isStopWord(after)) {
        const phrase = words.slice(termIndex - 1, termIndex + termLength + 1).join(' ');
        if (this.isValidPhrase(phrase) && phrase.split(' ').length <= CONFIG.maxPhraseWords) {
          phrases.add(phrase);
        }
      }
    }
  }

  async extractPhrasesFromTitle(title, keywords) {
    const phrases = new Set();
    const titleWords = title.toLowerCase().split(/\s+/);
    
    // Check for compound patterns in title
    for (const { pattern } of keywords.compoundPatterns) {
      if (title.toLowerCase().includes(pattern)) {
        phrases.add(pattern);
      }
    }
    
    // Build phrases from title keywords
    for (let i = 0; i < titleWords.length; i++) {
      const word = titleWords[i];
      
      if (keywords.allKeywords.has(word) && !this.extractor.isStopWord(word)) {
        // Add single keyword
        phrases.add(word);
        
        // Try 2-word phrases
        if (i > 0 && !this.extractor.isStopWord(titleWords[i - 1])) {
          phrases.add(`${titleWords[i - 1]} ${word}`);
        }
        if (i < titleWords.length - 1 && !this.extractor.isStopWord(titleWords[i + 1])) {
          phrases.add(`${word} ${titleWords[i + 1]}`);
        }
        
        // Try 3-word phrases
        if (i > 0 && i < titleWords.length - 1) {
          const phrase = `${titleWords[i - 1]} ${word} ${titleWords[i + 1]}`;
          if (this.isValidPhrase(phrase)) {
            phrases.add(phrase);
          }
        }
      }
    }
    
    return Array.from(phrases);
  }

  isValidPhrase(phrase) {
    const words = phrase.split(/\s+/);
    
    // Check length constraints
    if (phrase.length < 3 || words.length > CONFIG.maxPhraseWords) {
      return false;
    }
    
    // Don't allow phrases that start or end with stop words
    if (this.extractor.isStopWord(words[0]) || 
        this.extractor.isStopWord(words[words.length - 1])) {
      return false;
    }
    
    // Ensure at least one non-stop word
    const nonStopWords = words.filter(w => !this.extractor.isStopWord(w));
    if (nonStopWords.length === 0) {
      return false;
    }
    
    return true;
  }

  rankPhrases(phrases, keywords, domainTerms) {
    const scoredPhrases = phrases.map(phrase => {
      let score = 0;
      const phraseLower = phrase.toLowerCase();
      const phraseWords = phraseLower.split(/\s+/);
      
      // Score based on containing domain terms
      if (domainTerms.includes(phraseLower)) {
        score += 30;
      }
      
      // Score based on keyword presence
      phraseWords.forEach(word => {
        if (keywords.allKeywords.has(word)) {
          score += 20;
        }
      });
      
      // Score based on compound pattern match
      keywords.compoundPatterns.forEach(({ pattern }) => {
        if (phraseLower === pattern) {
          score += 40;
        } else if (phraseLower.includes(pattern)) {
          score += 20;
        }
      });
      
      // Prefer 2-3 word phrases
      if (phraseWords.length === 2 || phraseWords.length === 3) {
        score += 15;
      }
      
      // Penalize very common phrases
      if (this.isGenericPhrase(phrase)) {
        score -= 20;
      }
      
      return { phrase, score };
    });
    
    // Sort by score and return phrases only
    return scoredPhrases
      .sort((a, b) => b.score - a.score)
      .map(item => item.phrase);
  }

  isGenericPhrase(phrase) {
    const genericPatterns = [
      /^the\s+/i,
      /\s+the$/i,
      /^this\s+/i,
      /^that\s+/i,
      /^these\s+/i,
      /^those\s+/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(phrase));
  }
}

/**
 * Load current theme configuration
 */
async function loadCurrentTheme() {
  const templatePath = path.join(__dirname, '../config.template.js');
  
  try {
    if (!fs.existsSync(templatePath)) {
      throw new Error('config.template.js not found');
    }
    
    const configUrl = `file:///${templatePath.replace(/\\/g, '/')}?t=${Date.now()}`;
    const config = await import(configUrl);
    
    const { CURRENT_WEBSITE_CONTENT, CATEGORY_INFO } = config;
    
    return {
      theme: CURRENT_WEBSITE_CONTENT.theme?.name || CURRENT_WEBSITE_CONTENT.title,
      categories: CURRENT_WEBSITE_CONTENT.categories || [],
      categoryInfo: CATEGORY_INFO || {}
    };
  } catch (error) {
    log(`❌ Failed to load theme configuration: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Load link history
 */
function loadLinkHistory() {
  if (!fs.existsSync(CONFIG.linkHistoryFile)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(CONFIG.linkHistoryFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

/**
 * Save link history
 */
function saveLinkHistory(history) {
  fs.writeFileSync(CONFIG.linkHistoryFile, JSON.stringify(history, null, 2));
}

/**
 * Check if theme has changed
 */
async function hasThemeChanged(articleSlug) {
  const history = loadLinkHistory();
  const currentTheme = await loadCurrentTheme();
  
  if (!history[articleSlug]) {
    return true; // New article
  }
  
  return history[articleSlug].theme !== currentTheme.theme;
}

/**
 * Clean old links from content
 */
function cleanOldLinks(content) {
  // Remove all internal links, preserve external links
  return content.replace(
    /\[([^\]]+)\]\((\/articles\/[^)]+|\/blog\/[^)]+|\/[^)\/]+)\)/g,
    '$1' // Keep link text only
  );
}

/**
 * Extract article metadata
 */
function extractMetadata(content) {
  const metadata = {};
  
  // Extract title
  const titleMatch = content.match(/title:\s*["']([^"']+)["']/);
  metadata.title = titleMatch ? titleMatch[1] : '';
  
  // Extract description
  const descMatch = content.match(/description:\s*["']([^"']+)["']/);
  metadata.description = descMatch ? descMatch[1] : '';
  
  // Extract category
  const categoryMatch = content.match(/categories:\s*\n\s*-\s*["']([^"']+)["']/);
  const singleCategoryMatch = content.match(/category:\s*["']?([^"'\n]+)["']?/);
  metadata.category = categoryMatch ? categoryMatch[1] : (singleCategoryMatch ? singleCategoryMatch[1] : '');
  
  // Extract published time
  const timeMatch = content.match(/publishedTime:\s*['"]?([^'"]+)['"]?/);
  metadata.publishedTime = timeMatch ? new Date(timeMatch[1]) : null;
  
  return metadata;
}

/**
 * Theme-agnostic extraction of meaningful phrases
 */
async function extractMeaningfulPhrases(content, articleTitle, articleCategory) {
  const extractor = new KeywordExtractor();
  const builder = new PhraseBuilder(extractor);
  
  try {
    const phrases = await builder.buildPhrases(content, articleTitle, articleCategory);
    return phrases;
  } catch (error) {
    log(`   ⚠️ Error extracting phrases: ${error.message}`, 'yellow');
    return [];
  }
}

/**
 * Get all articles from configured directories
 */
function getAllArticles() {
  const articles = [];
  
  // Scan articles directory
  if (fs.existsSync(CONFIG.articlesDir)) {
    const dirs = fs.readdirSync(CONFIG.articlesDir);
    dirs.forEach(slug => {
      const articlePath = path.join(CONFIG.articlesDir, slug, 'index.mdx');
      if (fs.existsSync(articlePath)) {
        const content = fs.readFileSync(articlePath, 'utf-8');
        const metadata = extractMetadata(content);
        articles.push({
          slug,
          path: articlePath,
          dir: 'articles',
          ...metadata
        });
      }
    });
  }
  
  // Scan blog directory
  if (fs.existsSync(CONFIG.blogDir)) {
    const dirs = fs.readdirSync(CONFIG.blogDir);
    dirs.forEach(slug => {
      const articlePath = path.join(CONFIG.blogDir, slug, 'index.mdx');
      if (fs.existsSync(articlePath)) {
        const content = fs.readFileSync(articlePath, 'utf-8');
        const metadata = extractMetadata(content);
        articles.push({
          slug,
          path: articlePath,
          dir: 'blog',
          ...metadata
        });
      }
    });
  }
  
  // Scan data/blog directory
  if (fs.existsSync(CONFIG.dataBlogDir)) {
    const dirs = fs.readdirSync(CONFIG.dataBlogDir);
    dirs.forEach(slug => {
      const articlePath = path.join(CONFIG.dataBlogDir, slug, 'index.mdx');
      if (fs.existsSync(articlePath)) {
        const content = fs.readFileSync(articlePath, 'utf-8');
        const metadata = extractMetadata(content);
        articles.push({
          slug,
          path: articlePath,
          dir: 'blog',  // Use 'blog' for URL path
          ...metadata
        });
      }
    });
  }
  
  return articles;
}

/**
 * Calculate relevance score between two articles
 */
function calculateRelevanceScore(article1, article2, extractor) {
  let score = 0;
  
  // Category match
  if (article1.category && article2.category && 
      article1.category === article2.category) {
    score += 50;
  }
  
  // Title keyword overlap (excluding stop words)
  const title1Words = article1.title.toLowerCase().split(/\s+/)
    .filter(word => word.length > 3 && !extractor.isStopWord(word));
  const title2Words = article2.title.toLowerCase().split(/\s+/)
    .filter(word => word.length > 3 && !extractor.isStopWord(word));
  
  const commonWords = title1Words.filter(word => 
    title2Words.some(w2 => word.includes(w2) || w2.includes(word))
  );
  
  score += commonWords.length * 20;
  
  // Description similarity
  if (article1.description && article2.description) {
    const desc1Words = article1.description.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3 && !extractor.isStopWord(word));
    const desc2Words = article2.description.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3 && !extractor.isStopWord(word));
    
    const commonDescWords = desc1Words.filter(word => 
      desc2Words.some(w2 => word.includes(w2) || w2.includes(word))
    );
    
    score += commonDescWords.length * 10;
  }
  
  return score;
}

/**
 * Find related articles using theme-agnostic matching
 */
function findRelatedArticles(currentSlug, checkTime = false) {
  const allArticles = getAllArticles();
  const currentArticle = allArticles.find(a => a.slug === currentSlug);
  
  if (!currentArticle) return [];
  
  const extractor = new KeywordExtractor();
  
  // Calculate relevance scores
  const scoredArticles = allArticles
    .filter(article => {
      if (article.slug === currentSlug) return false;
      
      // Time check for scheduled articles
      if (checkTime && currentArticle.publishedTime && article.publishedTime) {
        if (article.publishedTime > currentArticle.publishedTime) {
          return false;
        }
      }
      
      return true;
    })
    .map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(currentArticle, article, extractor)
    }))
    .filter(article => article.relevanceScore > 30)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return scoredArticles.slice(0, 5);
}

/**
 * Insert internal links into content
 */
async function insertInternalLinks(content, article, relatedArticles) {
  let linksAdded = 0;
  
  // Separate frontmatter and body
  const frontmatterMatch = content.match(/^(---[\s\S]*?---\n)/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  let body = frontmatterMatch ? content.slice(frontmatter.length) : content;
  
  // Extract meaningful phrases
  const phrases = await extractMeaningfulPhrases(content, article.title, article.category);
  
  if (phrases.length === 0) {
    log(`   ⚠️ No suitable anchor text found`, 'yellow');
    return content;
  }
  
  log(`   📝 Found ${phrases.length} potential anchor texts:`, 'blue');
  phrases.slice(0, 5).forEach(phrase => log(`      - ${phrase}`, 'cyan'));
  
  // Find best matches for each related article
  for (const relatedArticle of relatedArticles) {
    if (linksAdded >= CONFIG.maxLinksPerArticle) break;
    
    // Find best matching phrase
    let bestPhrase = null;
    let bestScore = 0;
    
    for (const phrase of phrases) {
      const phraseWords = phrase.toLowerCase().split(/\s+/);
      const targetTitleWords = relatedArticle.title.toLowerCase().split(/\s+/);
      
      let score = 0;
      
      // Calculate relevance score
      phraseWords.forEach(word => {
        targetTitleWords.forEach(titleWord => {
          if (word.length > 3 && titleWord.length > 3) {
            if (word === titleWord) score += 10;
            else if (word.includes(titleWord) || titleWord.includes(word)) score += 5;
          }
        });
      });
      
      // Category bonus
      if (article.category === relatedArticle.category) {
        score += 15;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPhrase = phrase;
      }
    }
    
    // Insert link if good match found
    if (bestPhrase && bestScore > 10) {
      const regex = new RegExp(`\\b${bestPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = body.match(regex);
      
      if (match) {
        // Check if already linked
        const beforeMatch = body.substring(0, body.indexOf(match[0]));
        const afterMatch = body.substring(body.indexOf(match[0]) + match[0].length);
        
        const isAlreadyLinked = 
          (beforeMatch.endsWith('[') && afterMatch.startsWith(']')) ||
          beforeMatch.match(/\[[^\]]*$/) ||
          afterMatch.match(/^[^\[]*\]/);
        
        const linkPath = `/${relatedArticle.dir}/${relatedArticle.slug}`;
        
        if (!isAlreadyLinked && !body.includes(linkPath)) {
          const replacement = `[${match[0]}](${linkPath})`;
          body = body.replace(match[0], replacement);
          linksAdded++;
          
          log(`   ✅ Added link: "${match[0]}" → ${linkPath}`, 'green');
          log(`      Relevance score: ${bestScore}`, 'cyan');
          
          // Remove used phrase
          const index = phrases.indexOf(bestPhrase);
          if (index > -1) {
            phrases.splice(index, 1);
          }
        }
      }
    }
  }
  
  if (linksAdded === 0) {
    log(`   ⚠️ No internal links added (no suitable matches)`, 'yellow');
  }
  
  return frontmatter + body;
}

/**
 * Process internal links for a single article
 */
async function processArticleLinks(articleSlug, options = {}) {
  const { checkTime = false, forceUpdate = false } = options;
  
  log(`\n📄 Processing article: ${articleSlug}`, 'cyan');
  
  // Find article
  const allArticles = getAllArticles();
  const article = allArticles.find(a => a.slug === articleSlug);
  
  if (!article) {
    log(`   ❌ Article not found: ${articleSlug}`, 'red');
    return false;
  }
  
  log(`   📋 Article info:`, 'blue');
  log(`      Title: ${article.title}`, 'reset');
  log(`      Category: ${article.category || 'none'}`, 'reset');
  log(`      Directory: ${article.dir}`, 'reset');
  
  // Check theme change
  if (!forceUpdate && !(await hasThemeChanged(articleSlug))) {
    log(`   ℹ️ Theme unchanged, skipping`, 'yellow');
    return false;
  }
  
  // Read article content
  const content = fs.readFileSync(article.path, 'utf-8');
  
  // Clean old links
  log(`   🧹 Cleaning old links...`, 'blue');
  const cleanContent = cleanOldLinks(content);
  
  // Find related articles
  const relatedArticles = findRelatedArticles(articleSlug, checkTime);
  
  if (relatedArticles.length === 0) {
    log(`   ⚠️ No related articles found`, 'yellow');
    return false;
  }
  
  log(`   🔗 Found ${relatedArticles.length} related articles:`, 'blue');
  relatedArticles.forEach(r => {
    log(`      - ${r.title} (relevance: ${r.relevanceScore})`, 'reset');
  });
  
  // Insert internal links
  const updatedContent = await insertInternalLinks(cleanContent, article, relatedArticles);
  
  // Check for changes
  if (updatedContent === cleanContent) {
    log(`   ℹ️ No changes made`, 'yellow');
    return false;
  }
  
  // Save updated article
  fs.writeFileSync(article.path, updatedContent);
  
  // Update history
  const history = loadLinkHistory();
  const currentTheme = await loadCurrentTheme();
  history[articleSlug] = {
    theme: currentTheme.theme,
    updatedAt: new Date().toISOString(),
    linksAdded: (updatedContent.match(/\]\(/g) || []).length - (cleanContent.match(/\]\(/g) || []).length
  };
  saveLinkHistory(history);
  
  log(`   ✨ Processing complete!`, 'green');
  return true;
}

// Export for use as module
export class SmartInternalLinkEngine {
  constructor(config = {}) {
    Object.assign(CONFIG, config);
  }
  
  async processArticle(articlePath, allArticles, options = {}) {
    const slug = path.basename(path.dirname(articlePath));
    return processArticleLinks(slug, options);
  }
}

export {
  processArticleLinks,
  loadCurrentTheme,
  hasThemeChanged,
  cleanOldLinks,
  findRelatedArticles,
  KeywordExtractor,
  PhraseBuilder
};

// Command line interface
if (process.argv[1] === __filename) {
  const command = process.argv[2];
  const articleSlug = process.argv[3];
  const checkTime = process.argv.includes('--check-time');
  const forceUpdate = process.argv.includes('--force');
  const cleanOnly = process.argv.includes('--clean-only');
  
  async function main() {
    log('\n🔗 Smart Internal Link System v3.0', 'bright');
    log('=' .repeat(60), 'blue');
    
    if (command === 'clean-all') {
      // Clean all article links
      const allArticles = getAllArticles();
      let cleaned = 0;
      
      log('\n🧹 Cleaning all article links...', 'cyan');
      
      for (const article of allArticles) {
        const content = fs.readFileSync(article.path, 'utf-8');
        const cleanContent = cleanOldLinks(content);
        
        if (content !== cleanContent) {
          fs.writeFileSync(article.path, cleanContent);
          cleaned++;
          log(`   ✅ Cleaned: ${article.slug}`, 'green');
        }
      }
      
      log(`\n✨ Cleaning complete! Cleaned ${cleaned} articles`, 'green');
      
    } else if (command === 'article' && articleSlug) {
      if (cleanOnly) {
        // Clean specific article
        const allArticles = getAllArticles();
        const article = allArticles.find(a => a.slug === articleSlug);
        
        if (article) {
          const content = fs.readFileSync(article.path, 'utf-8');
          const cleanContent = cleanOldLinks(content);
          fs.writeFileSync(article.path, cleanContent);
          log(`✅ Cleaned article: ${articleSlug}`, 'green');
        } else {
          log(`❌ Article not found: ${articleSlug}`, 'red');
        }
      } else {
        await processArticleLinks(articleSlug, { checkTime, forceUpdate });
      }
      
    } else if (command === 'all') {
      const allArticles = getAllArticles();
      let processed = 0;
      let updated = 0;
      
      for (const article of allArticles) {
        processed++;
        const result = await processArticleLinks(article.slug, { checkTime, forceUpdate });
        if (result) updated++;
      }
      
      log('\n' + '=' .repeat(60), 'blue');
      log(`📊 Processing complete:`, 'bright');
      log(`   Articles processed: ${processed}`, 'blue');
      log(`   Articles updated: ${updated}`, 'green');
      
    } else {
      log('\nUsage:', 'cyan');
      log('  node smart-internal-links.js article <slug> [--check-time] [--force] [--clean-only]', 'reset');
      log('  node smart-internal-links.js all [--check-time] [--force]', 'reset');
      log('  node smart-internal-links.js clean-all', 'reset');
      log('\nOptions:', 'cyan');
      log('  --check-time  Enable time checking (for scheduled articles)', 'reset');
      log('  --force       Force update (ignore theme check)', 'reset');
      log('  --clean-only  Only clean links, don\'t add new ones', 'reset');
      log('\nCommands:', 'cyan');
      log('  clean-all     Clean all article links', 'reset');
    }
    
    log('\n✨ Done!', 'green');
  }
  
  main().catch(console.error);
}