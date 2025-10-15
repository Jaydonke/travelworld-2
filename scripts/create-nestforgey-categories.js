#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categoriesDir = path.join(__dirname, '../src/content/categories');

const categories = {
  'smart-storage': {
    title: 'Smart Storage Solutions',
    description: 'Creative storage hacks and organization ideas for maximizing your living space'
  },
  'home-renovation': {
    title: 'Home Renovation',
    description: 'Renovation tips and home improvement strategies to transform your living spaces'
  },
  'interior-design': {
    title: 'Interior Design',
    description: 'Design ideas and decorating tips to create beautiful, functional home interiors'
  },
  'furniture-hacks': {
    title: 'Furniture Hacks',
    description: 'Creative furniture modifications and multi-purpose solutions for smart living'
  },
  'sustainable-living': {
    title: 'Sustainable Living',
    description: 'Eco-friendly home solutions and green improvements for sustainable living'
  },
  'smart-home': {
    title: 'Smart Home',
    description: 'Home automation and technology integration for modern connected living'
  },
  'outdoor-spaces': {
    title: 'Outdoor Spaces',
    description: 'Backyard improvements and outdoor living solutions for enhanced home enjoyment'
  },
  'flooring-walls': {
    title: 'Flooring & Walls',
    description: 'Flooring options and wall treatment ideas to refresh your home surfaces'
  },
  'home-office': {
    title: 'Home Office',
    description: 'Home office setup and workspace optimization for productive remote work'
  }
};

// Create categories
for (const [categoryId, data] of Object.entries(categories)) {
  const categoryPath = path.join(categoriesDir, categoryId);
  
  // Check if category already exists
  if (fs.existsSync(categoryPath)) {
    console.log(`✓ Category "${categoryId}" already exists`);
    continue;
  }
  
  // Create category directory
  fs.mkdirSync(categoryPath, { recursive: true });
  
  // Create index.json
  const indexPath = path.join(categoryPath, 'index.json');
  const indexContent = {
    title: data.title,
    description: data.description
  };
  
  fs.writeFileSync(indexPath, JSON.stringify(indexContent, null, 2));
  console.log(`✓ Created category: ${categoryId}`);
}

console.log('\n✨ All NestForgey categories have been created!');