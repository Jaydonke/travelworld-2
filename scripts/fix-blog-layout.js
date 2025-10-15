#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix BlogLayoutSidebar.astro
const layoutPath = path.join(__dirname, '../src/layouts/BlogLayoutSidebar.astro');
let content = fs.readFileSync(layoutPath, 'utf8');

// Fix the data destructuring and author references
content = content.replace(
  `const { post, headings } = Astro.props as Props;
const { title, description, authors, pubDate, updatedDate, heroImage, categories, tags } =
	post.data;

const currLocale = getLocaleFromUrl(Astro.url);
const t = useTranslations(currLocale);
const authorsData = await getEntries(authors);`,
  `const { post, headings } = Astro.props as Props;
const { title, description, authors = [], publishedTime, lastModified, cover, category, tags } =
	post.data;
const pubDate = publishedTime;
const updatedDate = lastModified;
const heroImage = cover;
const categories = category ? [category] : [];

const currLocale = getLocaleFromUrl(Astro.url);
const t = useTranslations(currLocale);
// Convert author strings to entry references if needed
const authorRefs = authors?.map(author => 
	typeof author === 'string' ? { collection: 'authors', id: author } : author
) || [];
const authorsData = authorRefs.length > 0 ? await getEntries(authorRefs) : [];`
);

// Fix pubDate references to handle string dates
content = content.replace(/pubDate\.toISOString\(\)/g, 'new Date(pubDate).toISOString()');
content = content.replace(/updatedDate\.toISOString\(\)/g, 'new Date(updatedDate).toISOString()');

// Fix heroImage conditional rendering
content = content.replace(
  /<Image\s+src={heroImage}\s+alt={`cover for \${title}`}/g,
  `{heroImage && <Image
					src={heroImage}
					alt={\`cover for \${title}\`}`
);

fs.writeFileSync(layoutPath, content);
console.log('✅ Fixed BlogLayoutSidebar.astro');

// Also check other blog layouts
const layouts = [
  'BlogLayoutCentered.astro',
  'BlogLayoutLeft.astro'
];

for (const layoutFile of layouts) {
  const filePath = path.join(__dirname, '../src/layouts', layoutFile);
  if (fs.existsSync(filePath)) {
    let layoutContent = fs.readFileSync(filePath, 'utf8');
    
    // Apply similar fixes
    layoutContent = layoutContent.replace(
      /const { title, description, authors, pubDate, updatedDate, heroImage, categories, tags } =\s+post\.data;/,
      `const { title, description, authors = [], publishedTime, lastModified, cover, category, tags } =
	post.data;
const pubDate = publishedTime;
const updatedDate = lastModified;
const heroImage = cover;
const categories = category ? [category] : [];`
    );
    
    layoutContent = layoutContent.replace(
      /const authorsData = await getEntries\(authors\);/,
      `// Convert author strings to entry references if needed
const authorRefs = authors?.map(author => 
	typeof author === 'string' ? { collection: 'authors', id: author } : author
) || [];
const authorsData = authorRefs.length > 0 ? await getEntries(authorRefs) : [];`
    );
    
    layoutContent = layoutContent.replace(/pubDate\.toISOString\(\)/g, 'new Date(pubDate).toISOString()');
    layoutContent = layoutContent.replace(/updatedDate\.toISOString\(\)/g, 'new Date(updatedDate).toISOString()');
    
    fs.writeFileSync(filePath, layoutContent);
    console.log(`✅ Fixed ${layoutFile}`);
  }
}