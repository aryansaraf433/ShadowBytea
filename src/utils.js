/**
 * Splits a long message into smaller chunks that fit within Telegram's message limit (4096 characters).
 * Tries to split by newlines if possible.
 * @param {string} text - The text to split.
 * @param {number} [maxLength=4000] - Maximum length per chunk (leave buffer for markdown).
 * @returns {string[]} An array of message chunks.
 */
export function splitMessage(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let currentChunk = '';

  const lines = text.split('\n');

  for (const line of lines) {
    if ((currentChunk.length + line.length + 1) > maxLength) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If a single line is still longer than maxLength, split it by characters
      if (line.length > maxLength) {
        let remaining = line;
        while (remaining.length > 0) {
          chunks.push(remaining.substring(0, maxLength));
          remaining = remaining.substring(maxLength);
        }
      } else {
        currentChunk = line;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Escapes characters for Telegram's MarkdownV2
 * (Note: Often we just use standard Markdown with OpenRouter, but if strictly needed for MarkdownV2)
 * Since we usually just want to format nicely and the API might return standard Markdown, we can just use
 * Telegraf's HTML or Markdown parser.
 */
export function escapeMarkdownV2(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
