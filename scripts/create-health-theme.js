#!/usr/bin/env node

/**
 * Create Health & Wellness Theme
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create health theme
const healthTheme = {
  name: 'Health & Wellness',
  description: 'Health, wellness, fitness, and medical topics',
  categories: {
    'nutrition': {
      keywords: ['nutrition', 'diet', 'food', 'supplement', 'vitamin', 'nutrient', 'grocery', 'detox', 'fasting', 'digestive', 'fiber', 'electrolyte', 'okra'],
      description: 'Nutrition & Diet'
    },
    'fitness': {
      keywords: ['fitness', 'exercise', 'workout', 'training', 'gym', 'sport', 'recovery', 'cryotherapy', 'body sculpt'],
      description: 'Fitness & Exercise'
    },
    'wellness': {
      keywords: ['wellness', 'health', 'healthy', 'lifestyle', 'longevity', 'wellbeing', 'relaxation', 'aesthetic', 'spa'],
      description: 'General Wellness'
    },
    'mental-health': {
      keywords: ['mental', 'mood', 'mind', 'meditation', 'stress', 'anxiety', 'therapy', 'phototherapy'],
      description: 'Mental Health'
    },
    'medical-tech': {
      keywords: ['monitoring', 'wearable', 'smart', 'tech', 'tracking', 'assistant', 'patch', 'device', 'real-time'],
      description: 'Health Technology'
    },
    'treatments': {
      keywords: ['therapy', 'treatment', 'IV', 'nad', 'lymphatic', 'drainage', 'personalized', 'medical'],
      description: 'Treatments & Therapies'
    },
    'alternative': {
      keywords: ['alternative', 'natural', 'holistic', 'non-invasive', 'sustainable', 'organic'],
      description: 'Alternative Medicine'
    },
    'beverages': {
      keywords: ['drink', 'beverage', 'water', 'hydration', 'non-alcoholic', 'powder'],
      description: 'Healthy Beverages'
    },
    'community': {
      keywords: ['community', 'space', 'social', 'group', 'focused'],
      description: 'Health Communities'
    }
  },
  defaultCategory: 'wellness'
};

// Save theme
const rulesPath = path.join(__dirname, '../config/categorization-rules.json');

let rules = {};
if (fs.existsSync(rulesPath)) {
  rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
}

rules['health-wellness-theme'] = healthTheme;

fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));

console.log('✅ Health & Wellness theme created successfully!');
console.log('To switch to this theme, run: node scripts/dynamic-categorization.js switch health-wellness-theme');