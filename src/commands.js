import { historyManager } from './history.js';
import { config } from './config.js';
import { features } from './features.js';
import fs from 'fs';

// Store active reminders in memory
const activeReminders = {};

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
/imagine <prompt> - Generates an image.
/mode <chill|strict|hacker|default> - Change AI persona.
/run <lang> <code> - Run code (e.g. /run py print(1))
/search <query> - Search the live web.
/export - Download your conversation as a file.
/remind <seconds> <message> - Sets a recurring reminder.
/stopremind - Stops your active reminder.
/model - Shows currently active AI model.
/stats - Shows your usage statistics.
/ping - Returns bot latency.
/id - Returns your Telegram user ID.

*Just type any question, and I'll do my best to help you!*
    `.trim();
    return ctx.replyWithMarkdown(helpMessage);
  });

  bot.command('remind', (ctx) => {
    historyManager.trackUser(ctx);
    const userId = ctx.from.id;
    
    // Parse arguments
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      return ctx.reply('⚠️ Please provide the time in seconds and the message.\n\n*Example:* `/remind 10 GO AND CODE BRO`', { parse_mode: 'Markdown' });
    }

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 1) {
      return ctx.reply('⚠️ The time must be a valid number of seconds greater than 0.');
    }

    const message = args.slice(1).join(' ');

    // Clear existing reminder if any
    if (activeReminders[userId]) {
      clearInterval(activeReminders[userId]);
    }

    // Set new reminder
    activeReminders[userId] = setInterval(() => {
      ctx.reply(`⏰ **REMINDER:**\n\n${message}`, { parse_mode: 'Markdown' }).catch(() => {
        // If we fail to send (e.g. user blocked bot), stop the interval
        clearInterval(activeReminders[userId]);
        delete activeReminders[userId];
      });
    }, seconds * 1000);

    return ctx.reply(`✅ I will remind you every **${seconds} seconds** saying:\n"${message}"\n\nType /stopremind to turn this off.`, { parse_mode: 'Markdown' });
  });

  bot.command('stopremind', (ctx) => {
    historyManager.trackUser(ctx);
    const userId = ctx.from.id;
    
    if (activeReminders[userId]) {
      clearInterval(activeReminders[userId]);
      delete activeReminders[userId];
      return ctx.reply('🛑 Your reminder has been stopped.');
    } else {
      return ctx.reply('You don\'t have any active reminders.');
    }
  });

  bot.command('imagine', async (ctx) => {
    historyManager.trackUser(ctx);
    const prompt = ctx.message.text.split(' ').slice(1).join(' ');
    if (!prompt) return ctx.reply('⚠️ Please provide a prompt. Example: `/imagine a cyberpunk city`', { parse_mode: 'Markdown' });
    
    await ctx.sendChatAction('upload_photo');
    const imageUrl = features.generateImage(prompt);
    return ctx.replyWithPhoto(imageUrl, { caption: `🎨 **Generated:** ${prompt}`, parse_mode: 'Markdown' });
  });

  bot.command('mode', (ctx) => {
    historyManager.trackUser(ctx);
    const mode = ctx.message.text.split(' ')[1];
    const validModes = ['default', 'chill', 'strict', 'hacker'];
    
    if (!mode || !validModes.includes(mode.toLowerCase())) {
      return ctx.reply(`⚠️ Invalid mode. Please choose one of: ${validModes.join(', ')}\nExample: \`/mode hacker\``, { parse_mode: 'Markdown' });
    }
    
    historyManager.setPersona(ctx.from.id, mode.toLowerCase());
    return ctx.reply(`🎭 Persona successfully changed to: **${mode.toUpperCase()}**`, { parse_mode: 'Markdown' });
  });

  bot.command('run', async (ctx) => {
    historyManager.trackUser(ctx);
    const args = ctx.message.text.split(' ').slice(1);
    const lang = args[0];
    const code = args.slice(1).join(' ');

    if (!lang || !code) return ctx.reply('⚠️ Syntax: `/run <language> <code>`\nExample: `/run py print("hello")`', { parse_mode: 'Markdown' });
    
    await ctx.sendChatAction('typing');
    const output = await features.executeCode(lang, code);
    return ctx.reply(`💻 **Output:**\n\`\`\`text\n${output}\n\`\`\``, { parse_mode: 'Markdown' });
  });

  bot.command('search', async (ctx) => {
    historyManager.trackUser(ctx);
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) return ctx.reply('⚠️ Please provide a query. Example: `/search latest tech news`', { parse_mode: 'Markdown' });

    await ctx.sendChatAction('typing');
    const results = await features.webSearch(query);
    return ctx.reply(results, { parse_mode: 'Markdown' });
  });

  bot.command('export', async (ctx) => {
    historyManager.trackUser(ctx);
    const userId = ctx.from.id;
    const history = historyManager.getHistory(userId);
    
    if (history.length === 0) return ctx.reply('⚠️ Your conversation history is empty.');

    const markdown = features.exportHistory(history);
    const buffer = Buffer.from(markdown, 'utf-8');
    
    await ctx.sendChatAction('upload_document');
    return ctx.replyWithDocument({
      source: buffer,
      filename: `Chat_Export_${userId}.md`
    });
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
