const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '../src/content/blog');
const dirs = fs.readdirSync(blogDir).filter(d => {
  return fs.statSync(path.join(blogDir, d)).isDirectory() && d !== 'en';
});

console.log('Total articles:', dirs.length);
console.log('---');

const now = new Date();
let visible = 0;
let future = 0;

dirs.forEach(d => {
  const mdxPath = path.join(blogDir, d, 'index.mdx');
  if (fs.existsSync(mdxPath)) {
    const content = fs.readFileSync(mdxPath, 'utf8');
    const match = content.match(/publishedTime: (.+)/);
    if (match) {
      const date = new Date(match[1]);
      if (date < now) {
        visible++;
        console.log('✓', d, '(Published:', date.toISOString().split('T')[0] + ')');
      } else {
        future++;
        console.log('⏰', d, '(Future:', date.toISOString().split('T')[0] + ')');
      }
    }
  }
});

console.log('---');
console.log('Visible articles:', visible);
console.log('Future articles:', future);