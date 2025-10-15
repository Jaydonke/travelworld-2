#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const articlesDir = path.join(__dirname, '../src/content/articles');

// Function to clean all existing internal links from content
function cleanExistingLinks(content) {
  // Remove markdown links pointing to internal articles
  let cleaned = content.replace(/[([^]]+)](/articles/[^)]+)/g, '$1');
  
  // Remove HTML anchor tags for internal links
  cleaned = cleaned.replace(/<a[^>]*href="/articles/[^"]*"[^>]*>([^<]+)</a>/gi, '$1');
  
  return cleaned;
}

// SEO-optimized inline internal links mapping
const inlineLinksMap = {
  'improve-mobile-ad-experience-ux-tips-and-best-practices': [
    { searchPhrase: 'responsive design', linkTo: 'improve-ad-performance-with-responsive-ads-messaging-tests' },
    { searchPhrase: 'ad performance', linkTo: 'dynamic-search-ads-optimization-tips-and-best-practices' }
  ]
};

console.log('Script created');
