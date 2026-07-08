import express from 'express';
import { validateConfig } from './config.js';
import { logger } from './logger.js';
import { createBot } from './bot.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Dummy route for Render's health checks and UptimeRobot
app.get('/', (req, res) => {
  res.send('Kaptaan Bot is running! 🎓');
});

async function bootstrap() {
  try {
    // 1. Validate environment configuration
    validateConfig();

    // 2. Create Bot instance
    const bot = createBot();

    // 3. Launch Bot
    logger.info('Starting Kaptaan Bot...');
    bot.launch();
    
    logger.info('Kaptaan Bot is successfully running and polling for updates! 🚀');

    // 4. Start Express Server
    app.listen(PORT, () => {
      logger.info(`Dummy web server listening on port ${PORT} (Useful for 24/7 pings)`);
    });

    // Enable graceful stop
    process.once('SIGINT', () => {
      logger.info('Received SIGINT, stopping bot gracefully...');
      bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      logger.info('Received SIGTERM, stopping bot gracefully...');
      bot.stop('SIGTERM');
    });

  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
