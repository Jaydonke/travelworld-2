import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔑 API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('🔑 API Key preview:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 2
});

async function testConnection() {
  try {
    console.log('🧪 Testing OpenAI API connection...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Say hello in one word"
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API working!');
    console.log('📝 Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    console.error('📋 Error type:', error.constructor.name);
    
    if (error.code) {
      console.error('🔢 Error code:', error.code);
    }
    
    if (error.status) {
      console.error('🌐 HTTP status:', error.status);
    }
  }
}

testConnection();