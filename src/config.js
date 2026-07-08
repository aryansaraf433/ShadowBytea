import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables from .env file
dotenv.config();

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  MODEL: process.env.MODEL || 'openai/gpt-4.1-mini',
  
  // Advanced configuration
  MAX_HISTORY_LENGTH: 10, // Number of previous messages to keep for context
  MAX_MESSAGE_LENGTH: 4000 // Telegram's max is 4096, keeping a buffer
};

export function validateConfig() {
  if (!config.BOT_TOKEN) {
    logger.error('BOT_TOKEN is missing in environment variables.');
    process.exit(1);
  }
  
  if (!config.OPENROUTER_API_KEY) {
    logger.error('OPENROUTER_API_KEY is missing in environment variables.');
    process.exit(1);
  }
  
  logger.info('Configuration loaded successfully.');
}
