import { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../../services/chatService';
import './ChatView.css';

function ChatView() {
  const [messages, setMessages] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('chatMessages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }))
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
      }
    }
    // Initialize with welcome message if no saved messages
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI tutor assistant. I can help you with:\n\n📚 Academic questions\n📝 Study strategies\n🧮 Homework help\n💡 Learning tips\n\nWhat would you like to know?',
        timestamp: new Date()
      }
    ]
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Save to localStorage whenever messages change (except welcome message only)
  useEffect(() => {
    if (messages.length > 0 && (messages.length > 1 || messages[0].id !== 'welcome')) {
      localStorage.setItem('chatMessages', JSON.stringify(messages))
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Build conversation history for API (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Call API
      const response = await sendChatMessage(userMessage.content, conversationHistory);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'I apologize, but I couldn\'t generate a response. Please try again.',
        timestamp: new Date(),
        mock: response.mock || false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again in a moment.',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleClear = () => {
    if (window.confirm('Clear all messages and start a new conversation?')) {
      const welcomeMessage = [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your AI tutor assistant. I can help you with:\n\n📚 Academic questions\n📝 Study strategies\n🧮 Homework help\n💡 Learning tips\n\nWhat would you like to know?',
          timestamp: new Date()
        }
      ]
      setMessages(welcomeMessage)
      localStorage.setItem('chatMessages', JSON.stringify(welcomeMessage))
      setError('');
    }
  };

  return (
    <div className="chat-view-container">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-icon">🤖</span>
          <div>
            <h2>AI Tutor Assistant</h2>
            <p className="chat-subtitle">Your personal learning companion</p>
          </div>
        </div>
        <button className="chat-clear-btn" onClick={handleClear} title="Clear conversation">
          🗑️ Clear
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.error ? 'error-message' : ''}`}
          >
            <div className="message-avatar">
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.content.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant-message">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          ⚠️ {error}
        </div>
      )}

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask me anything about your studies..."
          value={inputMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

export default ChatView;

