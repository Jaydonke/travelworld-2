#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authorsDir = path.join(__dirname, '../src/content/authors');

// Japanese authors for okoge theme
const authors = [
  {
    slug: 'yuki-tanaka',
    name: 'Yuki Tanaka',
    job: 'Japanese Food Blogger',
    bio: 'Passionate about preserving traditional Japanese street food culture while exploring modern twists. Has visited over 200 street food stalls across Japan.',
    linkedin: 'yukitanaka',
    twitter: 'yuki_streetfood'
  },
  {
    slug: 'kenji-yamamoto',
    name: 'Kenji Yamamoto',
    job: 'Rice Culture Researcher',
    bio: 'Dedicated to documenting the history and cultural significance of rice in Japanese society. Expert in traditional rice cooking methods and regional varieties.',
    linkedin: 'kenjiyamamoto',
    twitter: 'kenji_rice'
  },
  {
    slug: 'sakura-nakamura',
    name: 'Sakura Nakamura',
    job: 'Recipe Developer',
    bio: 'Creates accessible Japanese recipes for home cooks worldwide. Specializes in adapting traditional dishes with locally available ingredients.',
    linkedin: 'sakuranakamura',
    twitter: 'sakura_recipes'
  },
  {
    slug: 'hiroshi-suzuki',
    name: 'Hiroshi Suzuki',
    job: 'Food Photographer',
    bio: 'Captures the beauty of Japanese street food through stunning photography. Documents food festivals and traditional cooking techniques across Japan.',
    linkedin: 'hiroshisuzuki',
    twitter: 'hiroshi_foodpix'
  },
  {
    slug: 'mei-chen',
    name: 'Mei Chen',
    job: 'Cultural Food Writer',
    bio: 'Explores the intersection of Japanese and other Asian cuisines. Writes about food history, cultural exchanges, and modern fusion trends.',
    linkedin: 'meichen',
    twitter: 'mei_foodculture'
  }
];

// Create each author
authors.forEach(author => {
  const authorDir = path.join(authorsDir, author.slug);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(authorDir)) {
    fs.mkdirSync(authorDir, { recursive: true });
    console.log(`Created directory: ${author.slug}`);
  }
  
  // Create author MDX file
  const mdxContent = `---
name: "${author.name}"
job: "${author.job}"
avatar: "/images/authors/${author.slug}.jpg"
bio: "${author.bio}"
linkedin: "${author.linkedin}"
twitter: "${author.twitter}"
---

${author.bio}

Specializing in Japanese cuisine and food culture, ${author.name} brings authentic insights and passion to every article.
`;
  
  const mdxPath = path.join(authorDir, 'index.mdx');
  fs.writeFileSync(mdxPath, mdxContent);
  console.log(`Created author: ${author.name}`);
});

console.log('\n✅ All okoge authors created successfully!');