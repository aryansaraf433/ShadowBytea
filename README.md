# Kaptaan 🎓

A fully production-ready, intelligent Telegram AI assistant built with Node.js, Telegraf, and OpenRouter API.

## Features

- **Intelligent Conversations**: Powered by top-tier models via OpenRouter (default: `nvidia/nemotron-3-ultra-550b-a55b:free`).
- **Memory**: Remembers conversation history independently for each user.
- **Smart Context Management**: Automatically trims old messages to never exceed the context limits.
- **Clean Markdown Output**: Delivers nicely formatted text, code blocks, lists, and tables.
- **Robust Error Handling**: Never crashes. Graceful retries on API failures.
- **Analytics & Stats**: Tracks usage stats per user.

## Prerequisites

- Node.js >= 18.0.0
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- OpenRouter API Key (from [OpenRouter](https://openrouter.ai/))

## Installation & Setup

1. **Clone the repository** (or download the files):
   ```bash
   git clone <your-repo-url>
   cd Kaptaan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your keys:
   ```env
   BOT_TOKEN=your_telegram_bot_token
   OPENROUTER_API_KEY=your_openrouter_key
   MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
   ```

4. **Start the Bot**:
   To run in production mode:
   ```bash
   npm start
   ```
   To run in development mode (auto-restarts on changes):
   ```bash
   npm run dev
   ```

## Deploying

### Deploying on Railway / Render
1. Create a new Web Service or Worker.
2. Link your GitHub repository.
3. Set the start command to `npm start`.
4. Add the Environment Variables (`BOT_TOKEN`, `OPENROUTER_API_KEY`, `MODEL`) in the dashboard.
5. Deploy!

### Deploying on a VPS (Linux)
1. SSH into your VPS.
2. Clone the repository and run `npm install`.
3. Install PM2 globally: `npm install -g pm2`.
4. Start the bot: `pm2 start src/index.js --name "kaptaan-bot"`.
5. Save the PM2 process: `pm2 save` and `pm2 startup`.

## Commands

- `/start` - Displays welcome message.
- `/help` - Shows every available feature.
- `/new` - Clears current conversation context.
- `/model` - Shows currently active AI model.
- `/stats` - Shows your usage statistics.
- `/ping` - Returns bot latency.
- `/id` - Returns your Telegram User ID.

## Troubleshooting

- **Bot is not responding**: Check if the `.env` variables are correctly set. Ensure `npm start` is running without errors.
- **OpenRouter Errors**: Check your OpenRouter account balance and rate limits. The bot logs all errors locally.
