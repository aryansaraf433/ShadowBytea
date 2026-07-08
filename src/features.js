import axios from 'axios';
import FormData from 'form-data';
import { search } from 'duck-duck-scrape';
import play from 'play-dl';
import { config } from './config.js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

export const features = {
  /**
   * Generates an image URL using the free Pollinations.ai API
   */
  generateImage(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    // Add seed to avoid caching
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;
  },

  /**
   * Executes code using the free Piston API
   */
  async executeCode(language, code) {
    try {
      // Piston language aliases mapping (simplified)
      const aliases = {
        'js': 'javascript',
        'py': 'python',
        'ts': 'typescript',
        'sh': 'bash',
        'cpp': 'c++'
      };
      
      const lang = aliases[language.toLowerCase()] || language.toLowerCase();
      
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: lang,
        version: '*',
        files: [{ content: code }]
      });

      if (response.data && response.data.run) {
        return response.data.run.output || 'No output.';
      }
      return 'Failed to execute code.';
    } catch (error) {
      logger.error(`Code execution error: ${error.message}`);
      return `Execution Error: ${error.message}`;
    }
  },

  /**
   * Transcribes OGG audio from Telegram using Groq Whisper API
   */
  async transcribeAudio(fileUrl) {
    if (!config.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    try {
      // 1. Download the file from Telegram as a buffer to avoid stream length issues with form-data
      const audioResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const audioBuffer = Buffer.from(audioResponse.data);

      // 2. Prepare Form Data for Groq
      const form = new FormData();
      form.append('file', audioBuffer, { filename: 'audio.ogg', contentType: 'audio/ogg' });
      form.append('model', 'whisper-large-v3'); // Groq's whisper model

      // 3. Send to Groq
      const transcriptResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${config.GROQ_API_KEY}`
        }
      });

      return transcriptResponse.data.text;
    } catch (error) {
      if (error.response) {
         logger.error(`Groq API Error: ${JSON.stringify(error.response.data)}`);
      }
      logger.error(`Transcription error: ${error.message}`);
      throw new Error('Failed to transcribe audio.');
    }
  },

  /**
   * Performs a web search and returns formatted context
   */
  async webSearch(query) {
    try {
      const searchResults = await search(query, {
        safeSearch: 'Moderate'
      });

      if (!searchResults.results || searchResults.results.length === 0) {
        return 'No results found on the web.';
      }

      // Take top 3 results
      const topResults = searchResults.results.slice(0, 3);
      
      let context = `Web Search Results for "${query}":\n\n`;
      topResults.forEach((res, index) => {
        context += `${index + 1}. **${res.title}**\n${res.description}\nSource: ${res.url}\n\n`;
      });

      return context;
    } catch (error) {
      logger.error(`Web search error: ${error.message}`);
      return `Search failed: ${error.message}`;
    }
  },

  /**
   * Formats history array into a Markdown document
   */
  exportHistory(history) {
    let markdown = '# Chat Export\n\n';
    
    for (const msg of history) {
      if (msg.role === 'user') {
        markdown += `**👤 You:**\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        markdown += `**🎓 Kaptaan:**\n${msg.content}\n\n`;
      }
    }
    
    return markdown;
  },

  /**
   * Searches for a song on YouTube and returns its audio stream
   */
  async getMusicStream(query) {
    try {
      // Authenticate with SoundCloud (gets a free client ID automatically)
      await play.getFreeClientID().then((clientID) => {
        play.setToken({ soundcloud : { client_id : clientID } });
      });

      // Search SoundCloud
      const searchResult = await play.search(query, { source: { soundcloud: 'tracks' }, limit: 1 });
      if (!searchResult || searchResult.length === 0) {
        throw new Error('No song found for that query.');
      }
      
      const track = searchResult[0];
      
      // Get the raw audio stream
      const stream = await play.stream(track.url);
      
      // Save stream to disk temporarily instead of a memory buffer
      // This prevents Telegraf/form-data from hanging on large buffers
      const tempPath = path.join(process.cwd(), `audio_${Date.now()}.mp3`);
      const writeStream = fs.createWriteStream(tempPath);
      
      for await (const chunk of stream.stream) {
        writeStream.write(chunk);
      }
      writeStream.end();
      
      // Wait for it to finish saving
      await new Promise(resolve => writeStream.on('finish', resolve));
      
      return {
        streamPath: tempPath,
        filename: 'audio.mp3',
        title: track.name,
        duration: track.durationInSec ? `${Math.floor(track.durationInSec / 60)}:${(track.durationInSec % 60).toString().padStart(2, '0')}` : 'Unknown',
        author: track.user.name,
        thumbnail: track.thumbnail,
        url: track.url
      };
    } catch (error) {
      logger.error(`Music search error: ${error.message}`);
      throw error;
    }
  }
};
