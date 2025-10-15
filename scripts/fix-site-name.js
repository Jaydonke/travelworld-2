#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/config/en/siteData.json.ts');

console.log('📝 Updating site name to BlogTonic...');

let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of Blogsmith with BlogTonic
content = content.replace(/Blogsmith/g, 'BlogTonic');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated siteData.json.ts');

// Also update French version if it exists
const frFilePath = path.join(__dirname, '../src/config/fr/siteData.json.ts');
if (fs.existsSync(frFilePath)) {
  console.log('📝 Updating French site data...');
  let frContent = fs.readFileSync(frFilePath, 'utf8');
  frContent = frContent.replace(/Blogsmith/g, 'BlogTonic');
  fs.writeFileSync(frFilePath, frContent, 'utf8');
  console.log('✅ Updated French siteData.json.ts');
}

console.log('🎉 Site name updated successfully!');