import authService from './authService.js';

const API_URL = '/student';

/**
 * Send a message to AI chat
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous conversation messages
 * @returns {Promise<Object>} AI response
 */
export async function sendChatMessage(message, conversationHistory = []) {
  try {
    const response = await authService.authenticatedRequest(`${API_URL}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory
      })
    });

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    throw new Error(error.message || 'Failed to send message');
  }
}

