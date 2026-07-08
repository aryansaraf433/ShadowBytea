import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { logger } from './logger.js';
import { setupCommands } from './commands.js';
import { generateResponse } from './ai.js';
import { historyManager } from './history.js';
import { splitMessage } from './utils.js';

export function createBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // Setup commands
  setupCommands(bot);

  // Handle all other text messages
  bot.on('text', async (ctx) => {
    // Ignore group commands not meant for us (if added to group)
    if (ctx.message.text.startsWith('/')) return;

    const userId = ctx.from.id;
    const userMessage = ctx.message.text;

    // Track user and stats
    historyManager.trackUser(ctx);
    historyManager.incrementMessageCount(userId);

    // Show typing indicator
    await ctx.sendChatAction('typing');

    // To maintain typing indicator for long requests, we can set up an interval
    const typingInterval = setInterval(() => {
      ctx.sendChatAction('typing').catch(() => {});
    }, 4000);

    try {
      // Get AI response
      const reply = await generateResponse(userId, userMessage);

      // Split message if it's too long for Telegram
      const chunks = splitMessage(reply);

      // Send each chunk
      for (const chunk of chunks) {
        // We use parse_mode 'Markdown' since OpenRouter models usually output standard markdown.
        // We catch markdown parsing errors and fallback to normal text if Telegraf strictly fails.
        try {
          await ctx.reply(chunk, { parse_mode: 'Markdown' });
        } catch (markdownError) {
          logger.warn(`Markdown parsing failed, sending as plain text: ${markdownError.message}`);
          await ctx.reply(chunk);
        }
      }
    } catch (error) {
      logger.error(`Error processing message from user ${userId}: ${error.message}`);
      await ctx.reply("An unexpected error occurred while processing your request. Please try again later.");
    } finally {
      clearInterval(typingInterval);
    }
  });

  // Handle unhandled updates gracefully
  bot.catch((err, ctx) => {
    logger.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
  });

  return bot;
}
