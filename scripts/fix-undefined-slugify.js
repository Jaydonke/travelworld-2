#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix textUtils.ts
const textUtilsPath = path.join(__dirname, '../src/js/textUtils.ts');
const textUtilsContent = fs.readFileSync(textUtilsPath, 'utf8');

const fixedTextUtils = textUtilsContent.replace(
  'export function slugify(text: string): string {\n\treturn text',
  'export function slugify(text: string): string {\n\t// Handle undefined, null, or empty values\n\tif (!text) return "";\n\t\n\treturn text'
);

fs.writeFileSync(textUtilsPath, fixedTextUtils);
console.log('✅ Fixed textUtils.ts');

// Fix blogUtils.ts
const blogUtilsPath = path.join(__dirname, '../src/js/blogUtils.ts');
const blogUtilsContent = fs.readFileSync(blogUtilsPath, 'utf8');

const fixedBlogUtils = blogUtilsContent.replace(
  `export function countItems(items: string[]): object {
\t// get counts of each item in the array
\tconst countedItems = items.reduce((acc, item) => {
\t\tconst val = acc[slugify(item)] || 0;

\t\treturn {
\t\t\t...acc,
\t\t\t[slugify(item)]: val + 1,
\t\t};
\t}, {});

\treturn countedItems;
}`,
  `export function countItems(items: string[]): object {
\t// get counts of each item in the array
\tconst countedItems = items.reduce((acc, item) => {
\t\t// Skip undefined, null, or empty items
\t\tif (!item) return acc;
\t\t
\t\tconst slugifiedItem = slugify(item);
\t\tconst val = acc[slugifiedItem] || 0;

\t\treturn {
\t\t\t...acc,
\t\t\t[slugifiedItem]: val + 1,
\t\t};
\t}, {});

\treturn countedItems;
}`
);

fs.writeFileSync(blogUtilsPath, fixedBlogUtils);
console.log('✅ Fixed blogUtils.ts');

console.log('\n🎉 All files fixed! Please restart the dev server.');