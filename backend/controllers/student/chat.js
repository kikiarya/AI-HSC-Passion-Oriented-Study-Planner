import { ErrorResponse } from '../../utils/errorResponse.js';

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL 
  || process.env.OPENAI_URL 
  || process.env.VITE_OPENAI_BASE_URL 
  || 'https://api.zmon.me/v1';

/**
 * POST /api/student/chat
 * Send a message to AI chat assistant
 */
export const sendChatMessage = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return ErrorResponse.badRequest('Message is required').send(res);
    }

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      return res.json({
        response: 'AI chat is currently unavailable. Please contact support.',
        mock: true,
        error: 'OpenAI API key not configured'
      });
    }

    // Build conversation history for context
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI tutor assistant for HSC (Higher School Certificate) students in Australia. 
Your role is to:
- Answer academic questions clearly and concisely
- Help students understand concepts in subjects like Mathematics, Physics, Chemistry, English, etc.
- Provide study tips and learning strategies
- Support students with their HSC preparation
- Be encouraging, friendly, and educational

Keep responses focused on educational topics. If asked about non-academic topics, politely redirect to study-related questions.`
      },
      // Add conversation history
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: message.trim()
      }
    ];

    // Call OpenAI API
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using gpt-4o-mini for faster and cheaper responses
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return res.json({
        response: aiResponse,
        mock: false,
        model: 'gpt-4o-mini'
      });

    } catch (apiError) {
      console.error('OpenAI chat API call failed:', apiError);
      return res.json({
        response: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
        mock: true,
        error: apiError.message
      });
    }

  } catch (err) {
    console.error('Chat error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

