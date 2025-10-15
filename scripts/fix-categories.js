import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixCategories() {
  const blogDir = path.join(__dirname, '../src/content/blog/en');
  
  // Get all article directories
  const articles = fs.readdirSync(blogDir);
  
  articles.forEach(article => {
    const articlePath = path.join(blogDir, article, 'index.mdx');
    
    if (fs.existsSync(articlePath)) {
      let content = fs.readFileSync(articlePath, 'utf8');
      
      // Fix category to categories array
      content = content.replace(/^category: (.+)$/m, (match, cat) => {
        // Remove quotes if present
        const cleanCat = cat.replace(/['"]/g, '');
        return `categories:\n  - "${cleanCat}"`;
      });
      
      fs.writeFileSync(articlePath, content);
      console.log(`Fixed categories for: ${article}`);
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
      
      // Fix category to categories array
      content = content.replace(/^category: (.+)$/m, (match, cat) => {
        // Remove quotes if present
        const cleanCat = cat.replace(/['"]/g, '');
        return `categories:\n  - "${cleanCat}"`;
      });
      
      fs.writeFileSync(articlePath, content);
      console.log(`Fixed categories for root: ${article}`);
    }
  });
}

fixCategories();