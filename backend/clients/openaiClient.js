import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

let openaiClientInstance;

export function getOpenAIClient() {
  if (!openaiClientInstance) {

    if(!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    const baseUrl = process.env.OPENAI_BASE_URL
      || process.env.OPENAI_URL
      || process.env.VITE_OPENAI_BASE_URL
      || 'https://api.zmon.me/v1';

    openaiClientInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl,
    });
  }
  return openaiClientInstance;
}

export default getOpenAIClient();
