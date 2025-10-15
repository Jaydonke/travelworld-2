# Article Generation Workflow Documentation

## Overview
There are TWO separate scripts that work together:
1. `generate-new-topics.js` - Generates NEW article topic ideas
2. `generate-articles.js` - Generates actual article content from topics in config.template.js

## Important: These scripts are NOT integrated!

### Script 1: Generate New Topics (`generate-new-topics.js`)
**Purpose**: Creates new article topic ideas that don't duplicate existing ones

**Usage**:
```bash
node scripts/generate-new-topics.js --count=15
```

**What it does**:
- Reads existing articles from config.template.js
- Checks .article-fingerprints.json for already generated articles
- Uses GPT to generate NEW, unique topic ideas
- Outputs topics in the EXACT format needed for config.template.js

**Output format matches config.template.js**:
```javascript
{
  "topic": "Article Title Here",
  "keywords": [
    "keyword1",
    "keyword2",
    "keyword3"
  ],
  "category": "category-name"
}
```

### Script 2: Generate Articles (`generate-articles.js`)
**Purpose**: Generates full article content from topics in config.template.js

**Existing flags** (not changed):
- `-c, --count` : Number of articles to generate
- `-s, --scheduled` : Save to scheduledarticle folder (instead of newarticle)
- `-f, --force` : Force regenerate even if already exists
- `-t, --topic` : Generate a specific topic (overrides config)

**Usage examples**:
```bash
# Generate 5 articles from config to newarticle folder
npm run generate-articles -c 5

# Generate 15 articles to scheduledarticle folder
npm run generate-articles -s -c 15

# Force regenerate all articles
npm run generate-articles -f
```

## Complete Workflow for New Articles

### Step 1: Generate New Topic Ideas
```bash
node scripts/generate-new-topics.js --count=15
```
This creates a file like `new-topics-2025-09-08.js` with 15 new topic ideas.

### Step 2: Add Topics to Configuration
1. Open the generated file (e.g., `new-topics-2025-09-08.js`)
2. Copy the article objects
3. Open `config.template.js`
4. Find the `articles: [` array in `CURRENT_WEBSITE_CONTENT`
5. Paste the new topics at the end of the array
6. Save config.template.js

### Step 3: Generate Article Content
```bash
# Generate to scheduled folder (recommended for new articles)
npm run generate-articles -s -c 15

# OR generate to regular folder
npm run generate-articles -c 15
```

### Step 4: Schedule Publishing (if using scheduled mode)
```bash
npm run schedule-articles
```

## Key Points

1. **The scripts are SEPARATE** - `generate-new-topics.js` only creates topic ideas, not articles
2. **Manual step required** - You must manually copy topics from the output file to config.template.js
3. **Duplicate prevention works** - Both scripts check for existing articles to avoid duplicates
4. **Format is correct** - The generated format exactly matches config.template.js structure

## Directory Structure
- `newarticle/` - Regular articles ready to publish
- `scheduledarticle/` - Articles waiting to be scheduled
- `.article-fingerprints.json` - Tracks all generated articles to prevent duplicates

## Troubleshooting

**Q: Why doesn't `generate-articles -s -c 15` automatically generate new topics?**
A: The `-s` flag means "scheduled mode" (save to scheduledarticle folder), not "generate new topics". You need to run `generate-new-topics.js` first.

**Q: Can I skip adding topics to config.template.js?**
A: No, `generate-articles.js` only reads topics from config.template.js. The topics must be added there first.

**Q: Will scheduled mode regenerate existing articles?**
A: No, the fix implemented checks both `newarticle` and `scheduledarticle` folders to prevent duplicates.