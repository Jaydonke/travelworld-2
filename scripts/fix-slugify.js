import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixSlugify() {
  const filePath = path.join(__dirname, '../src/js/textUtils.ts');
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add null check to slugify function
  content = content.replace(
    'export function slugify(text: string): string {\n\treturn text',
    'export function slugify(text: string): string {\n\tif (!text) return "";\n\treturn text'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed slugify function with null check');
}

fixSlugify();