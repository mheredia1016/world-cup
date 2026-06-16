import axios from 'axios';
import { config } from './config.js';

function splitIntoChunks(text) {
  const chunks = [];
  let current = '';

  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > 1900) {
      chunks.push(current);
      current = line;
    } else {
      current += current ? `\n${line}` : line;
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

export async function postToDiscord(content) {
  if (!config.webhook) {
    console.log('Missing WORLD_CUP_PREGAME_WEBHOOK');
    return;
  }

  const chunks = splitIntoChunks(content);

  for (const chunk of chunks) {
    await axios.post(config.webhook, {
      content: chunk
    });
  }
}
