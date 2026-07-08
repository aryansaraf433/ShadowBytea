import axios from 'axios';
import { config } from './config.js';
import { logger } from './logger.js';
import { historyManager } from './history.js';

function getSystemPrompt(persona, searchContext = '') {
  let basePrompt = '';

  switch (persona) {
    case 'chill':
      basePrompt = 'You are Kaptaan, a super chill AI bro. You help out but keep it casual, use slang, and never sound like a robot.';
      break;
    case 'strict':
      basePrompt = 'You are Professor Kaptaan, a strict and rigorous academic AI. You expect excellence, explain things formally, and do not tolerate laziness.';
      break;
    case 'hacker':
      basePrompt = 'You are k4pt44n, an elite cybersecurity AI. You speak in leetspeak occasionally, focus on security, and act like you are in the mainframe.';
      break;
    default:
      basePrompt = `You are Kaptaan 🎓.
You are an intelligent, friendly and accurate AI assistant.
You help with: Coding, Mathematics, Science, School, College, Linux, Windows, AI, Cybersecurity, Web Development, Career Guidance, Productivity.
Explain difficult concepts simply. Never invent facts. Always format nicely using Markdown.`;
  }

  if (searchContext) {
    basePrompt += `\n\n=== RECENT WEB SEARCH CONTEXT ===\n${searchContext}\nUse this context to answer the user's latest query accurately.`;
  }

  return basePrompt;
}

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://github.com/kaptaan-bot', // Optional but recommended by OpenRouter
    'X-Title': 'Kaptaan Bot', // Optional but recommended
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60s timeout for AI generation
});

/**
 * Sends a conversation to OpenRouter and gets a response.
 * @param {string|number} userId 
 * @param {string} userMessage 
 * @param {string} [searchContext]
 * @returns {Promise<string>}
 */
export async function generateResponse(userId, userMessage, searchContext = '') {
  // Add user message to history
  historyManager.addMessage(userId, 'user', userMessage);

  // Get full conversation history
  const userHistory = historyManager.getHistory(userId);

  // Construct payload with dynamic system prompt
  const persona = historyManager.getPersona(userId);
  const systemContent = getSystemPrompt(persona, searchContext);

  const messages = [
    { role: 'system', content: systemContent },
    ...userHistory
  ];

  let attempt = 0;
  const maxRetries = 1; // Retry once automatically

  while (attempt <= maxRetries) {
    try {
      logger.info(`Sending request to OpenRouter (Model: ${config.MODEL}, User: ${userId})`);
      const startTime = Date.now();
      
      const response = await openRouterClient.post('/chat/completions', {
        model: config.MODEL,
        messages: messages
      });
      
      const latency = Date.now() - startTime;
      logger.info(`Received response from OpenRouter in ${latency}ms`);

      const reply = response.data.choices[0].message.content;

      // Add assistant response to history
      historyManager.addMessage(userId, 'assistant', reply);

      return reply;
    } catch (error) {
      attempt++;
      logger.error(`OpenRouter API error (Attempt ${attempt}): ${error.message}`);
      
      if (error.response) {
         logger.error(`API Response Status: ${error.response.status}`);
         logger.error(`API Response Data: ${JSON.stringify(error.response.data)}`);
      }

      if (attempt > maxRetries) {
        return "I apologize, but I am currently experiencing connection issues with my servers. Please try again in a moment. 🙏";
      }
      
      logger.info('Retrying request...');
      await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
    }
  }
}
