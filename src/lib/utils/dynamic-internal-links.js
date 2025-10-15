/**
 * Dynamic Internal Links Generator - Financial Theme
 * Generates contextual internal links for personal finance content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Financial keywords for dynamic link generation
const FINANCE_KEYWORDS = [
  'budgeting', 'saving', 'investing', 'debt', 'credit', 'banking', 'crypto', 
  'financial planning', 'money management', 'tax planning', 'insurance'
];

/**
 * Extract meaningful keywords from article content
 * Focus on financial terms and actionable phrases
 */
function extractKeywords(title, description, content) {
  const fullText = (title + ' ' + description + ' ' + content).toLowerCase();
  
  // Financial stop words to exclude
  const stopWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'how', 'what', 'when', 'where', 'why', 'can', 'will', 'should',
    'article', 'blog', 'post', 'guide', 'tips', 'best', 'top', 'good', 'great'
  ];
  
  // Extract 2-4 word phrases that are meaningful
  const words = fullText.match(/\b\w+\b/g) || [];
  const phrases = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    const phrase2 = `${words[i]} ${words[i + 1]}`;
    const phrase3 = words[i + 2] ? `${words[i]} ${words[i + 1]} ${words[i + 2]}` : null;
    
    // Add 2-word phrases
    if (phrase2.length >= 8 && !containsStopWords(phrase2, stopWords)) {
      phrases.push(phrase2);
    }
    
    // Add 3-word phrases
    if (phrase3 && phrase3.length >= 12 && !containsStopWords(phrase3, stopWords)) {
      phrases.push(phrase3);
    }
  }
  
  // Filter and return top phrases
  return phrases
    .filter(phrase => isFinanciallyRelevant(phrase))
    .slice(0, 3); // Limit to 3 phrases per article
}

/**
 * Check if phrase contains stop words
 */
function containsStopWords(phrase, stopWords) {
  return stopWords.some(word => phrase.includes(word));
}

/**
 * Check if phrase is financially relevant
 */
function isFinanciallyRelevant(phrase) {
  const financialTerms = [
    'debt', 'credit', 'saving', 'budget', 'invest', 'crypto', 'bank', 'loan',
    'finance', 'money', 'dollar', 'payment', 'income', 'expense', 'tax',
    'insurance', 'mortgage', 'retirement', 'wealth', 'financial', 'economic'
  ];
  
  return financialTerms.some(term => phrase.includes(term));
}

/**
 * Generate dynamic keyword mapping (simplified version)
 * This is now primarily used for analysis rather than active linking
 */
export async function getCombinedKeywordMapping() {
  try {
    const articlesDir = path.join(__dirname, '../../content/articles');
    const articleDirs = fs.readdirSync(articlesDir)
      .filter(file => {
        const fullPath = path.join(articlesDir, file);
        return fs.statSync(fullPath).isDirectory();
      });

    console.log(`Generated ${articleDirs.length} dynamic keyword mappings`);
    
    // Return empty mapping since we're now using static mappings only
    return {};
    
  } catch (error) {
    console.error('Error generating dynamic keyword mapping:', error);
    return {};
  }
}

export { extractKeywords };