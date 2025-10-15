import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    console.log('Testing article generation...');

    const prompt = `Generate 25 articles and category info for a Pop Culture & Entertainment website (Flickova).

Categories to use: movies, music, tv-shows, celebrities, pop-culture, reviews, news, events

Return JSON:
{
  "articleConfig": {
    "enabled": true,
    "articles": [
      {
        "topic": "Article Title",
        "keywords": ["keyword phrase 1", "keyword phrase 2", "keyword phrase 3", "keyword phrase 4"],
        "category": "one-of-the-categories"
      }
    ]
  },
  "categoryInfo": {
    "category-name": {
      "name": "Category Name",
      "description": "Description",
      "shortDescription": "Short desc",
      "icon": "📱",
      "color": "#123456",
      "aboutContent": "About text",
      "detailedDescription": "Detailed desc",
      "popularTopics": ["Topic 1", "Topic 2", "Topic 3"],
      "seoKeywords": "keyword1, keyword2",
      "keywords": ["keyword1", "keyword2"]
    }
  }
}

Requirements:
- 25 diverse articles (reviews, guides, lists, comparisons, tutorials)
- Each article must have 4 keyword phrases (2-4 words each)
- Category must be from: movies, music, tv-shows, celebrities, pop-culture, reviews, news, events
- No year numbers in titles/keywords
- Create categoryInfo for all 8 categories

Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a content strategist. Return ONLY valid JSON, no markdown, no explanations. Categories must be from the exact list provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const content = response.choices[0].message.content;

    // Remove markdown if present
    const cleanedContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    try {
      const result = JSON.parse(cleanedContent);
      console.log(`\n✅ Successfully parsed JSON`);
      console.log(`📊 Number of articles generated: ${result.articleConfig.articles.length}`);

      // Show first 3 and last 3 articles
      console.log('\n📝 First 3 articles:');
      result.articleConfig.articles.slice(0, 3).forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.topic} (${article.category})`);
      });

      if (result.articleConfig.articles.length > 6) {
        console.log('\n📝 Last 3 articles:');
        result.articleConfig.articles.slice(-3).forEach((article, i) => {
          console.log(`  ${result.articleConfig.articles.length - 2 + i}. ${article.topic} (${article.category})`);
        });
      }

      // Check categories
      const categoriesUsed = new Set(result.articleConfig.articles.map(a => a.category));
      console.log(`\n📂 Categories used: ${categoriesUsed.size}/8`);
      console.log(`   ${Array.from(categoriesUsed).join(', ')}`);

    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError.message);
      console.log('Raw response:', cleanedContent.substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();