import { historyManager } from './history.js';
import { config } from './config.js';

export function setupCommands(bot) {
  bot.command('start', (ctx) => {
    historyManager.trackUser(ctx);
    const welcomeMessage = `Hello ${ctx.from.first_name}! 👋\n\nI am **Kaptaan** 🎓, your intelligent and friendly AI assistant.\n\nType /help to see what I can do, or simply send me a message to start chatting!`;
    return ctx.replyWithMarkdown(welcomeMessage);
  });

  bot.command('help', (ctx) => {
    historyManager.trackUser(ctx);
    const helpMessage = `
**Kaptaan 🎓 - Available Commands**

/start - Displays welcome message.
/help - Shows every available feature.
/new - Clears current conversation history.
/model - Shows currently active AI model.
/stats - Shows your usage statistics.
/ping - Returns bot latency.
/id - Returns your Telegram user ID.

*Just type any question, and I'll do my best to help you!*
    `.trim();
    return ctx.replyWithMarkdown(helpMessage);
  });

  bot.command('new', (ctx) => {
    historyManager.trackUser(ctx);
    historyManager.clearHistory(ctx.from.id);
    return ctx.reply('🗑️ Conversation context has been cleared. We are starting fresh!');
  });

  bot.command('model', (ctx) => {
    historyManager.trackUser(ctx);
    return ctx.reply(`🧠 Currently active AI model:\n\`${config.MODEL}\``, { parse_mode: 'Markdown' });
  });

  bot.command('stats', (ctx) => {
    historyManager.trackUser(ctx);
    const stats = historyManager.getStats(ctx.from.id);
    
    const statsMsg = `
📊 **Your Statistics**

**Total messages:** ${stats.totalMessages}
**Current model:** ${stats.currentModel}
**Conversation length:** ${stats.historyLength} messages
**User ID:** \`${stats.userId}\`
    `.trim();
    
    return ctx.replyWithMarkdown(statsMsg);
  });

  bot.command('ping', async (ctx) => {
    historyManager.trackUser(ctx);
    const start = Date.now();
    const message = await ctx.reply('Pong! 🏓');
    const latency = Date.now() - start;
    return ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      undefined,
      `Pong! 🏓\nLatency: ${latency}ms`
    );
  });

  bot.command('id', (ctx) => {
    historyManager.trackUser(ctx);
    return ctx.reply(`Your Telegram ID is: \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
  });
}
