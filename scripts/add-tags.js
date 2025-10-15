import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addTags() {
  const blogDir = path.join(__dirname, '../src/content/blog/en');

  // Get all article directories
  const articles = fs.readdirSync(blogDir);

  articles.forEach(article => {
    const articlePath = path.join(blogDir, article, 'index.mdx');

    if (fs.existsSync(articlePath)) {
      let content = fs.readFileSync(articlePath, 'utf8');

      // Add tags array after categories
      if (!content.includes('tags:')) {
        content = content.replace(/^categories:\n  - "(.+)"$/m, (match) => {
          return `${match}\ntags: []`;
        });

        fs.writeFileSync(articlePath, content);
        console.log(`Added tags for: ${article}`);
      }
    }
  });

  // Also fix articles in root blog directory
  const rootBlogDir = path.join(__dirname, '../src/content/blog');
  const rootArticles = fs.readdirSync(rootBlogDir).filter(item => {
    const itemPath = path.join(rootBlogDir, item);
    return fs.statSync(itemPath).isDirectory() && item !== 'en';
  });

  rootArticles.forEach(article => {
    const articlePath = path.join(rootBlogDir, article, 'index.mdx');

    if (fs.existsSync(articlePath)) {
      let content = fs.readFileSync(articlePath, 'utf8');

      // Add tags array after categories
      if (!content.includes('tags:')) {
        content = content.replace(/^categories:\n  - "(.+)"$/m, (match) => {
          return `${match}\ntags: []`;
        });

        fs.writeFileSync(articlePath, content);
        console.log(`Added tags for root: ${article}`);
      }
    }
  });
}

addTags();