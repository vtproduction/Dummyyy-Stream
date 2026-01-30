/**
 * Script to encode channel URLs for obfuscation.
 * Run: node scripts/encode-channels.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple XOR-based encoding (not cryptographic, just obfuscation)
const OBFUSCATION_KEY = 'ZapTV2026';

function encode(text) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  // Convert to base64 for safe storage in JSON
  return Buffer.from(result, 'binary').toString('base64');
}

const inputPath = join(__dirname, '../packages/channels/data/channels.json');
const outputPath = join(__dirname, '../packages/channels/data/channels.encoded.json');

console.log('Reading channels from:', inputPath);
const channels = JSON.parse(readFileSync(inputPath, 'utf-8'));

console.log(`Encoding ${channels.length} channels...`);

const encodedChannels = channels.map(channel => ({
  ...channel,
  // Encode both URL fields
  m3u8_url: encode(channel.m3u8_url),
  image_url: channel.image_url, // Keep image URLs readable
  _encoded: true, // Flag to indicate this data is encoded
}));

writeFileSync(outputPath, JSON.stringify(encodedChannels, null, 2));
console.log('Encoded channels written to:', outputPath);
console.log('Done!');
