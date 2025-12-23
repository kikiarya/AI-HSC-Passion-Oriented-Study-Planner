import { getOpenAIClient } from '../clients/openaiClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import { readFileSync } from 'fs';

export const createCareerPathway = async (req, res) => {
  try {
    const { prompt, model = 'gpt-4.1-nano', maxTokens = 5 } = req.body || {};
    const instructions = readFileSync('instructions/career-pathway-instruction.md', 'utf8');
    
    if (!prompt) {
      return ErrorResponse.badRequest('prompt is required', { code: 'MISSING_PROMPT' }).send(res);
    }

    const openai = getOpenAIClient();

    const response = await openai.responses.create({
      model: model,
      instructions,
      input: [
        {
          role: 'user',
          content: prompt
        },
      ],
      max_output_tokens: maxTokens,
      temperature: 0.7,
    });

    return res.status(200).json({
      response: JSON.parse(response.output_text)
    });
  } catch (err) {
    console.error('OpenAI career pathway error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};
