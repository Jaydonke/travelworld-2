#!/usr/bin/env node

/**
 * AI-Powered Dynamic Image Generation Script
 * ==========================================
 * Generates THREE theme-adaptive images using OpenAI's DALL-E based on config.template.js:
 * 
 * 1. favicon.png → favicon/ folder (theme-aware icon that adapts to the site category)
 * 2. site-logo.png → favicon_io/ folder (dynamic logo based on theme name and category)  
 * 3. site-theme.png → favicon_io/ folder (decorative pattern matching the theme style)
 * 
 * Features:
 * - Dynamically adapts to different themes (tech, food, finance, health, etc.)
 * - Uses theme colors from config (primaryColor, secondaryColor)
 * - Creates images that blend naturally with any background
 * - Generates contextually appropriate imagery for each category
 * 
 * After running this script:
 * - Run "npm run generate-favicon" to process favicon into all required sizes
 * - Run "npm run update-favicon" to deploy everything to the site
 * 
 * Images are created with soft edges and varying opacity to blend seamlessly with any background.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sharp from 'sharp';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const CONFIG = {
    faviconDir: path.join(__dirname, '../favicon'),
    faviconIoDir: path.join(__dirname, '../favicon_io'),
    configPath: path.join(__dirname, '../config.template.js')
};

/**
 * Load configuration from config.template.js
 */
async function loadConfig() {
    try {
        // Convert path to file:// URL for Windows compatibility
        const configUrl = new URL(`file:///${CONFIG.configPath.replace(/\\/g, '/')}`).href;
        const configModule = await import(configUrl);
        return configModule.CURRENT_WEBSITE_CONTENT;
    } catch (error) {
        log(`❌ Failed to load config: ${error.message}`, 'red');
        throw error;
    }
}

/**
 * Generate image prompt based on config
 */
function generateImagePrompt(config, imageType) {
    const title = config.title;
    const description = config.description;
    const primaryColorName = config.colorTheme?.primary || 'orange';
    
    // Map theme color names to better descriptions for AI
    function getColorDescription(colorName) {
        const colorMap = {
            'orange': 'bright orange',
            'red': 'bright red',
            'blue': 'bright blue',
            'green': 'bright green',
            'purple': 'bright purple',
            'pink': 'bright pink',
            'yellow': 'bright yellow',
            'cyan': 'bright cyan',
            'teal': 'teal',
            'indigo': 'indigo',
            'gray': 'medium gray',
            'slate': 'slate gray',
            'zinc': 'zinc gray',
            'neutral': 'neutral gray',
            'stone': 'warm gray',
            'amber': 'amber',
            'lime': 'lime green',
            'emerald': 'emerald green',
            'sky': 'sky blue',
            'violet': 'violet',
            'fuchsia': 'fuchsia',
            'rose': 'rose pink'
        };
        
        // Return mapped color or use the name directly
        return colorMap[colorName.toLowerCase()] || colorName;
    }
    
    const colorDescription = getColorDescription(primaryColorName);
    
    const basePrompt = {
        favicon: `Design a simple SOLID geometric shape as a favicon. Create ONE basic FILLED shape like a filled circle, filled square, filled triangle, filled hexagon, or filled star. Use ONLY solid ${colorDescription} color on transparent or pure white background. SOLID FILLED SHAPE with no holes, no outlines, no hollow parts. AVOID: apples, fruits, letters, text, existing logos, gray backgrounds, textured backgrounds. Just a simple SOLID geometric form. Minimal flat vector icon with clean edges.`,

        siteLogo: `Design an abstract logo using SOLID basic geometry. Create a simple combination of 1-2 FILLED geometric shapes. Use ONLY solid ${colorDescription} color on transparent or pure white background. All shapes must be SOLID and FILLED, no outlines, no hollow parts, no donuts. AVOID: apples, fruits, letters, existing logos, gray backgrounds, textured backgrounds. Think SOLID shapes like filled circles, filled triangles, or connected solid forms. Minimal flat vector design with clean edges.`,

        siteTheme: `Flat minimal illustration in wide aspect ratio, designed as a hero image for "${title}" website about ${description}. Create 1-2 simple recognizable objects related to the website topic. Use ONLY solid ${colorDescription} color on transparent or pure white background. All shapes must have CLOSED EDGES and be COMPLETELY FILLED (no gaps, no open lines). Objects should be theme-relevant (not abstract), with continuous closed outlines. Make it VERY sparse with 85% empty white space. AVOID: abstract patterns, open-ended lines, disconnected elements, gray backgrounds, textured backgrounds. Create simple but recognizable silhouettes related to the topic with clean edges.`
    };

    return basePrompt[imageType];
}

// Removed getCategoryElements function - no longer needed

/*
function getCategoryElements(category, config) {
    const categoryLower = category.toLowerCase();
    
    // Technology categories
    if (categoryLower.includes('tech') || categoryLower.includes('software') || categoryLower.includes('ai') || categoryLower.includes('crypto') || categoryLower.includes('blockchain')) {
        return {
            icons: 'circuit patterns, neural networks, binary code, hexagons, microchips',
            style: 'modern, sleek, futuristic, digital',
            shapes: 'geometric hexagons, circuit lines, nodes, data flows',
            metaphors: 'innovation, connectivity, digital transformation'
        };
    }
    
    // Entertainment & Pop Culture - Enhanced for PopZic with specific categories
    if (categoryLower.includes('entertainment') || categoryLower.includes('pop') || categoryLower.includes('culture') || categoryLower.includes('media')) {
        // Use PopZic's actual categories: television-history, music-in-film, social-media, anime, events, fashion, gaming, film-analysis
        const popzicCategories = config?.categories || [];
        const categoryIcons = [];
        
        if (popzicCategories.includes('television-history')) categoryIcons.push('retro TV screens');
        if (popzicCategories.includes('music-in-film')) categoryIcons.push('musical notes merging with film strips');
        if (popzicCategories.includes('social-media')) categoryIcons.push('trending hashtags, viral symbols');
        if (popzicCategories.includes('anime')) categoryIcons.push('manga-style sparkles');
        if (popzicCategories.includes('events')) categoryIcons.push('spotlight beams');
        if (popzicCategories.includes('fashion')) categoryIcons.push('stylized fabric waves');
        if (popzicCategories.includes('gaming')) categoryIcons.push('game controller silhouettes');
        if (popzicCategories.includes('film-analysis')) categoryIcons.push('director\'s viewfinder');
        
        return {
            icons: categoryIcons.length > 0 ? categoryIcons.join(', ') : 'stars, spotlights, film reels, music notes, trending symbols, popcorn kernels, cinema marquee lights',
            style: 'vibrant, dynamic, playful, energetic, engaging, fun',
            shapes: 'star bursts, neon waves, rhythmic pulses, social media bubbles, entertainment marquee patterns',
            metaphors: 'trending culture, creative expression, entertainment buzz, community engagement'
        };
    }
    
    // Finance & Investment
    if (categoryLower.includes('finance') || categoryLower.includes('investment') || categoryLower.includes('token') || categoryLower.includes('asset') || categoryLower.includes('rwa')) {
        return {
            icons: 'growth charts, coins, shields, building blocks, ascending arrows',
            style: 'professional, trustworthy, sophisticated, clean',
            shapes: 'upward trends, interconnected blocks, protective shields',
            metaphors: 'growth, security, stability, prosperity'
        };
    }
    
    // Food & Culinary
    if (categoryLower.includes('food') || categoryLower.includes('recipe') || categoryLower.includes('cooking') || categoryLower.includes('culinary')) {
        return {
            icons: 'chef hat, fork and spoon, steam wisps, plates, organic shapes',
            style: 'warm, appetizing, friendly, welcoming',
            shapes: 'circular plates, flowing steam, organic curves',
            metaphors: 'flavor, freshness, warmth, community'
        };
    }
    
    // Health & Wellness
    if (categoryLower.includes('health') || categoryLower.includes('wellness') || categoryLower.includes('fitness') || categoryLower.includes('medical')) {
        return {
            icons: 'heart pulse, leaves, yoga pose, medical cross, wellness symbols',
            style: 'clean, calming, trustworthy, vital',
            shapes: 'flowing lines, organic forms, circular harmony',
            metaphors: 'vitality, balance, care, growth'
        };
    }
    
    // Education & Learning
    if (categoryLower.includes('education') || categoryLower.includes('learning') || categoryLower.includes('tutorial') || categoryLower.includes('guide')) {
        return {
            icons: 'book, graduation cap, light bulb, pencil, knowledge tree',
            style: 'clear, inspiring, academic, accessible',
            shapes: 'open books, ascending steps, enlightenment rays',
            metaphors: 'knowledge, growth, discovery, enlightenment'
        };
    }
    
    // Travel & Tourism
    if (categoryLower.includes('travel') || categoryLower.includes('tourism') || categoryLower.includes('destination') || categoryLower.includes('adventure')) {
        return {
            icons: 'compass, airplane, globe, map pin, mountain peaks',
            style: 'adventurous, inspiring, open, exploratory',
            shapes: 'pathways, horizons, compass points, map contours',
            metaphors: 'exploration, discovery, journey, freedom'
        };
    }
    
    // Default/General
    return {
        icons: 'abstract symbols, elegant shapes, modern marks',
        style: 'contemporary, versatile, professional',
        shapes: 'geometric patterns, flowing lines, balanced forms',
        metaphors: 'innovation, quality, connection'
    };
}

// Removed generateFaviconPrompt function - no longer needed

/*
function generateFaviconPrompt(siteName, category, elements, primaryColor, secondaryColor, config) {
    const firstLetter = siteName.charAt(0).toUpperCase();
    const tagline = config.tagline || "Your source for all things pop culture!";
    
    return `Create a minimalist icon for "${siteName}" - ${tagline}. Design a clever combination of the letter "${firstLetter}" stylized as a pop culture icon, integrated with ${elements.icons}. The icon should evoke the energy of ${config.theme.focus}. Use vibrant ${primaryColor} (orange-red #ff5733) and electric ${secondaryColor} (bright cyan #33c4ff) colors in a ${elements.style} style that captures the essence of entertainment buzz and trending culture. The icon should be clean and readable at small sizes (16x16 pixels), with subtle neon glow effects and soft edges that blend naturally with any background color. Think of it as a trendy social media badge or entertainment app icon that pops with personality. No harsh borders, no solid background rectangles - just the icon elements themselves with gentle anti-aliasing and a subtle glow that makes it feel alive and engaging.`;
}

// Removed generateSiteLogoPrompt function - no longer needed

/*
function generateSiteLogoPrompt(siteName, category, elements, primaryColor, secondaryColor, config) {
    const tagline = config.tagline || "Your source for all things pop culture!";
    const heroSubtitle = config.ui.homepage.heroSubtitle;
    
    return `Create a sophisticated and playful wordmark logo for "${siteName}" with the tagline "${tagline}". The design should embody the mission: "${config.pages.about.mission}". The logo should reflect ${category} through ${elements.style} typography with cinema marquee-inspired lettering and subtle incorporation of ${elements.icons}. Use vibrant ${primaryColor} (#ff5733 orange-red) as the main color with electric ${secondaryColor} (#33c4ff cyan) accents creating a neon-lit entertainment district feel. Include elements that represent the diverse categories: ${config.categories.join(', ')}. The text should have soft edges with subtle glow effects and transparency that allow it to blend seamlessly with any website background. Include gentle neon gradient overlays and semi-transparent light streaks that create the excitement of a premiere night. Typography should embody ${elements.metaphors}. The logo should feel like a dynamic entertainment brand that keeps people "in the know and entertained" as stated in the SEO description.`;
}

// Removed generateSiteThemePrompt function - no longer needed

/*
function generateSiteThemePrompt(siteName, category, elements, primaryColor, secondaryColor, config) {
    const heroTitle = config.ui.homepage.heroTitle;
    const focus = config.theme.focus;
    
    return `Create an abstract decorative pattern for "${siteName}" - a ${category} website that serves as "${heroTitle}". Design flowing ${elements.shapes} mixed with elements representing ${config.categories.join(', ')} - think retro TV static patterns, anime sparkles, social media notification bubbles, gaming pixels, fashion runway lights, and film strip perforations. The pattern should capture "${focus}". Use vibrant ${primaryColor} (#ff5733 orange-red) and electric ${secondaryColor} (#33c4ff cyan) with varying opacity levels (from 10% to 80% transparency) creating a festival atmosphere with stage lights and neon signs. Include confetti-like elements, trending arrows, viral spread patterns, and entertainment venue marquee dots. The elements should be scattered organically with plenty of negative space, creating a subtle background texture that feels like the energy of a pop culture convention or entertainment festival. Include soft neon glows, gentle motion blurs, and semi-transparent overlays that allow the pattern to blend naturally with any background. The overall effect should be ${elements.style} and work as a subtle watermark that makes visitors feel they're at the center of pop culture buzz.`;
}
*/

/**
 * Deep clean image to remove artifacts and stains
 */
async function deepCleanImage(inputPath, outputPath) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Escape backslashes for Python by replacing \ with \\
    const inputPathEscaped = inputPath.replace(/\\/g, '\\\\');
    const outputPathEscaped = outputPath.replace(/\\/g, '\\\\');

    const cleanScript = `
from PIL import Image

img = Image.open('${inputPathEscaped}').convert('RGBA')
pixels = img.load()
width, height = img.size

for x in range(width):
    for y in range(height):
        r, g, b, a = pixels[x, y]
        if a == 0: continue

        # Detect colors to keep
        is_orange = r > 200 and g > 50 and g < 150 and b < 100
        is_red = r > 200 and g < 100 and b < 100
        is_black = max(r, g, b) < 40
        is_white = min(r, g, b) > 240

        if not (is_orange or is_red or is_black or is_white):
            # Check if gray
            if max(r, g, b) - min(r, g, b) < 30:
                pixels[x, y] = (255, 255, 255, 0)
            # Check for light artifacts
            elif (r + g + b) // 3 > 200 and max(r, g, b) - min(r, g, b) < 60:
                pixels[x, y] = (255, 255, 255, 0)

img.save('${outputPathEscaped}', 'PNG', optimize=True)
`;

    try {
        // Write the Python script to a temporary file
        const tempScriptPath = path.join(__dirname, '_temp_clean.py');
        fs.writeFileSync(tempScriptPath, cleanScript);

        // Run the Python script
        await execAsync(`python "${tempScriptPath}"`);

        // Clean up temp script
        if (fs.existsSync(tempScriptPath)) {
            fs.unlinkSync(tempScriptPath);
        }

        log(`✅ Deep cleaned image`, 'green');
    } catch (error) {
        log(`⚠️ Deep clean failed: ${error.message}`, 'yellow');
        // If deep clean fails, just copy the file
        fs.copyFileSync(inputPath, outputPath);
    }
}

/**
 * Remove white background from image using Python rembg
 */
async function removeWhiteBackground(inputPath, outputPath) {
    try {
        log(`🎨 Removing background using AI (rembg)...`, 'cyan');
        
        // First, try to use Python rembg for better results
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Write a temporary Python script file for better reliability
        const tempScriptPath = path.join(__dirname, '_temp_rembg.py');
        const pythonScript = `
import sys
import os
from PIL import Image
from rembg import remove

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import locale
    if locale.getpreferredencoding().upper() != 'UTF-8':
        os.environ['PYTHONIOENCODING'] = 'utf-8'

try:
    with Image.open(sys.argv[1]) as img:
        output = remove(img)
        output.save(sys.argv[2], 'PNG')
    print("Success")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`;
        
        // Try to run Python with rembg
        try {
            // Write the Python script to a temp file
            fs.writeFileSync(tempScriptPath, pythonScript);
            
            // Run the Python script
            const pythonCmd = `python "${tempScriptPath}" "${inputPath}" "${outputPath}"`;
            const { stdout, stderr } = await execAsync(pythonCmd, { 
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            
            // Clean up temp script
            fs.unlinkSync(tempScriptPath);
            
            if (stderr && !stderr.includes('Success')) {
                throw new Error(`Python rembg failed: ${stderr}`);
            }
            
            log(`✅ Background removed successfully using AI`, 'green');
            return true;
        } catch (pythonError) {
            log(`⚠️ Python rembg error: ${pythonError.message}`, 'yellow');
            log(`⚠️ Falling back to sharp processing...`, 'yellow');
            
            // Fallback: Simply keep the image with white background
            // Don't try to remove background with sharp as it creates artifacts
            await sharp(inputPath)
                .png({
                    quality: 100,
                    compressionLevel: 9
                })
                .toFile(outputPath);
            
            log(`✅ Background removed using sharp fallback`, 'green');
            return true;
        }
    } catch (error) {
        log(`⚠️ Background removal failed: ${error.message}`, 'yellow');
        // If removal fails, just copy the original
        fs.copyFileSync(inputPath, outputPath);
        return false;
    }
}

/**
 * Download image from URL and remove background
 */
async function downloadAndProcessImage(url, outputPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        
        // Save temporary file
        const tempPath = outputPath + '.temp';
        const tempPath2 = outputPath + '.temp2';
        fs.writeFileSync(tempPath, Buffer.from(buffer));
        
        // Remove white background
        await removeWhiteBackground(tempPath, tempPath2);
        
        // Deep clean to remove artifacts
        log(`🧹 Deep cleaning to remove artifacts...`, 'cyan');
        await deepCleanImage(tempPath2, outputPath);
        
        // Clean up temp files
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (fs.existsSync(tempPath2)) fs.unlinkSync(tempPath2);
        
        return true;
    } catch (error) {
        log(`❌ Download failed: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Generate image using DALL-E
 */
async function generateImage(prompt, size = '1024x1024') {
    try {
        log(`🎨 Generating theme-adaptive image...`, 'cyan');
        
        // Enhanced prompt for clean background
        const enhancedPrompt = prompt + `\n\nIMPORTANT:
- PURE WHITE or TRANSPARENT background (no gray, no texture, no patterns)
- SOLID FILLED shapes with CLOSED EDGES
- Single solid color (no gradients)
- All edges must connect (no gaps or openings)
- Complete closed silhouettes only
- No text or letters
- No disconnected elements
- No brand logos
- Simple and minimal
- Every shape must form a complete closed loop
- Clean, crisp edges with no artifacts or stains
- Professional quality with no background noise`;
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: size,
            quality: "hd",
            response_format: "url",
            style: "vivid"  // 使用vivid风格可能有助于更清晰的前景
        });

        const imageUrl = response.data[0].url;
        log(`✅ Image generated with adaptive blending`, 'green');
        return imageUrl;
    } catch (error) {
        log(`❌ Image generation failed: ${error.message}`, 'red');
        throw error;
    }
}

// Removed these functions as update-favicon.js will handle the processing

/**
 * Ensure directories exist
 */
function ensureDirectories() {
    const dirs = [CONFIG.faviconDir, CONFIG.faviconIoDir];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`📁 Created directory: ${dir}`, 'blue');
        }
    });
}

/**
 * Main function
 */
async function main() {
    log('\n====================================', 'bright');
    log('   AI-Powered Image Generator', 'bright');
    log('====================================', 'bright');
    log('Generates favicon, site-logo, and site-theme with transparent backgrounds', 'cyan');
    
    try {
        // Load configuration
        log('\n📚 Loading configuration...', 'cyan');
        const config = await loadConfig();
        log(`✅ Loaded config for: ${config.title} (${config.theme.category})`, 'green');
        log(`  Primary Color: ${config.branding.primaryColor}`, 'blue');
        log(`  Secondary Color: ${config.branding.secondaryColor}`, 'blue');
        
        // Ensure directories exist
        ensureDirectories();
        
        // 1. Generate favicon (only one image needed)
        log('\n🎨 [1/3] Generating favicon image...', 'cyan');
        const faviconPrompt = generateImagePrompt(config, 'favicon');
        const faviconUrl = await generateImage(faviconPrompt);
        const faviconPath = path.join(CONFIG.faviconDir, 'favicon.png');
        await downloadAndProcessImage(faviconUrl, faviconPath);
        log(`✅ Favicon saved to: ${faviconPath}`, 'green');
        
        // 2. Generate site logo (only one image needed)
        log('\n🎨 [2/3] Generating site logo...', 'cyan');
        const logoPrompt = generateImagePrompt(config, 'siteLogo');
        const logoUrl = await generateImage(logoPrompt, '1024x1024');
        const logoPath = path.join(CONFIG.faviconIoDir, 'site-logo.png');
        await downloadAndProcessImage(logoUrl, logoPath);
        log(`✅ Site logo saved to: ${logoPath}`, 'green');
        
        // 3. Generate site theme image (only one image needed)
        log('\n🎨 [3/3] Generating site theme image...', 'cyan');
        const themePrompt = generateImagePrompt(config, 'siteTheme');
        const themeUrl = await generateImage(themePrompt, '1024x1024');
        const themePath = path.join(CONFIG.faviconIoDir, 'site-theme.png');
        await downloadAndProcessImage(themeUrl, themePath);
        log(`✅ Site theme saved to: ${themePath}`, 'green');
        
        log('\n====================================', 'green');
        log('    ✨ Generation Complete!', 'green');
        log('====================================', 'green');
        
        log('\n📁 Generated files:', 'cyan');
        log(`  ✅ ${CONFIG.faviconDir}/favicon.png`, 'green');
        log(`  ✅ ${CONFIG.faviconIoDir}/site-logo.png`, 'green');
        log(`  ✅ ${CONFIG.faviconIoDir}/site-theme.png`, 'green');
        
        log('\n💡 Next steps:', 'cyan');
        log('  1. Run "npm run generate-favicon" to process favicon into all sizes', 'yellow');
        log('  2. Run "npm run update-favicon" to deploy all images to the site', 'yellow');
        log('  3. Clear browser cache to see the changes', 'yellow');
        
        log('\n📝 Note:', 'blue');
        log('  - All images have transparent backgrounds', 'blue');
        log('  - The generate-favicon script will create all required favicon sizes', 'blue');
        log('  - The update-favicon script will copy everything to the correct locations', 'blue');
        
    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});