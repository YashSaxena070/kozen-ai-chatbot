const express = require('express');
const router = express.Router();
const validator = require('validator');

// Security: Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for API calls
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Input validation for chat messages
const validateChatInput = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }
  
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
  }
  
  // Security: Sanitize the message
  req.body.message = validator.escape(message.trim());
  
  next();
};

// Security: Authentication middleware for API
const requireApiAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Secure chat endpoint
router.post('/chat', requireApiAuth, apiLimiter, validateChatInput, async (req, res) => {
  try {
    const { message } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error('❌ Gemini API key not configured');
      return res.status(500).json({ error: 'AI service not available' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // Security: Make API request with timeout and error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'KOzen-AI-Chatbot/1.0'
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error:', errorData);
      return res.status(response.status).json({ 
        error: 'AI service temporarily unavailable' 
      });
    }

    const data = await response.json();
    
    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }

    // Security: Sanitize the response
    const aiResponse = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove markdown
      .substring(0, 2000); // Limit response length

    console.log(`✅ Chat request processed for user: ${req.session.user}`);
    
    res.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(408).json({ error: 'Request timeout' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Security: Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router; 