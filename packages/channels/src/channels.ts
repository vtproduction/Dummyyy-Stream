import type { Channel, RawChannel } from './types';

/**
 * Transform raw channel data to normalized Channel format
 */
export function transformChannel(raw: RawChannel): Channel {
  return {
    id: raw.item_id,
    name: raw.name,
    logo: raw.image_url,
    url: raw.m3u8_url,
  };
}

/**
 * Load and transform channels from raw data
 */
export function loadChannels(rawChannels: RawChannel[]): Channel[] {
  return rawChannels.map(transformChannel);
}
