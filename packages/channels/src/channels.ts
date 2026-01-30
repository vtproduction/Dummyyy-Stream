import type { Channel, RawChannel } from './types';

// Must match the key in scripts/encode-channels.js
const OBFUSCATION_KEY = 'ZapTV2026';

/**
 * Decode an XOR-obfuscated base64 string
 */
function decodeUrl(encoded: string): string {
  try {
    // Decode from base64
    const decoded = atob(encoded);
    // XOR decrypt
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    // If decoding fails, assume it's already plain text
    return encoded;
  }
}

/**
 * Transform raw channel data to normalized Channel format
 */
export function transformChannel(raw: RawChannel & { _encoded?: boolean }): Channel {
  const url = raw._encoded ? decodeUrl(raw.m3u8_url) : raw.m3u8_url;
  return {
    id: raw.item_id,
    name: raw.name,
    logo: raw.image_url,
    url,
  };
}

/**
 * Load and transform channels from raw data
 */
export function loadChannels(rawChannels: RawChannel[]): Channel[] {
  return rawChannels.map(transformChannel);
}
