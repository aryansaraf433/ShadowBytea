import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { config } from './config.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// In-memory cache for fast access
let users = {};
let history = {};
let stats = {};

function loadData() {
  try {
    if (fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    if (fs.existsSync(HISTORY_FILE)) history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    if (fs.existsSync(STATS_FILE)) stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch (error) {
    logger.error(`Error loading data from disk: ${error.message}`);
  }
}

function saveData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    logger.error(`Error saving data to ${file}: ${error.message}`);
  }
}

// Initial load
loadData();

export const historyManager = {
  /**
   * Tracks a user in the database.
   * @param {Object} ctx - Telegraf context.
   */
  trackUser(ctx) {
    const from = ctx.from;
    if (!from) return;

    const userId = from.id.toString();
    
    if (!users[userId]) {
      users[userId] = {
        id: userId,
        username: from.username || 'unknown',
        firstName: from.first_name || 'unknown',
        joinedAt: new Date().toISOString(),
        persona: 'default'
      };
    } else {
      // Update info in case username or name changed
      users[userId].username = from.username || users[userId].username;
      users[userId].firstName = from.first_name || users[userId].firstName;
      if (!users[userId].persona) users[userId].persona = 'default';
    }
    
    users[userId].lastActive = new Date().toISOString();
    
    saveData(USERS_FILE, users);
  },

  /**
   * Sets the persona/mode for a user.
   */
  setPersona(userId, persona) {
    userId = userId.toString();
    if (users[userId]) {
      users[userId].persona = persona;
      saveData(USERS_FILE, users);
    }
  },

  /**
   * Gets the persona/mode for a user.
   */
  getPersona(userId) {
    userId = userId.toString();
    return users[userId]?.persona || 'default';
  },

  /**
   * Gets conversation history for a user.
   * @param {string|number} userId 
   * @returns {Array} Array of message objects for OpenRouter
   */
  getHistory(userId) {
    userId = userId.toString();
    if (!history[userId]) {
      history[userId] = [];
    }
    return history[userId];
  },

  /**
   * Adds a message to a user's history and trims it to prevent exceeding context.
   * @param {string|number} userId 
   * @param {string} role 'user' or 'assistant'
   * @param {string} content 
   */
  addMessage(userId, role, content) {
    userId = userId.toString();
    if (!history[userId]) {
      history[userId] = [];
    }

    history[userId].push({ role, content });

    // Trim history to MAX_HISTORY_LENGTH (keep latest messages)
    if (history[userId].length > config.MAX_HISTORY_LENGTH) {
      // We want to slice from the end. But ensure we don't start with an assistant message
      // ideally we trim a user-assistant pair.
      const removeCount = history[userId].length - config.MAX_HISTORY_LENGTH;
      history[userId].splice(0, removeCount);
    }

    saveData(HISTORY_FILE, history);
  },

  /**
   * Clears history for a user.
   * @param {string|number} userId 
   */
  clearHistory(userId) {
    userId = userId.toString();
    history[userId] = [];
    saveData(HISTORY_FILE, history);
  },

  /**
   * Tracks message statistics for a user.
   * @param {string|number} userId 
   */
  incrementMessageCount(userId) {
    userId = userId.toString();
    if (!stats[userId]) {
      stats[userId] = { totalMessages: 0 };
    }
    stats[userId].totalMessages += 1;
    saveData(STATS_FILE, stats);
  },

  /**
   * Gets user statistics.
   * @param {string|number} userId 
   * @returns {Object}
   */
  getStats(userId) {
    userId = userId.toString();
    return {
      totalMessages: stats[userId]?.totalMessages || 0,
      historyLength: this.getHistory(userId).length,
      currentModel: config.MODEL,
      userId: userId
    };
  }
};
