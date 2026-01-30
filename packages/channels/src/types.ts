/**
 * Raw channel data from channels.json
 */
export interface RawChannel {
  item_id: string;
  name: string;
  description: string;
  image_url: string;
  m3u8_url: string;
}

/**
 * Normalized channel type used throughout the app
 */
export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
}

/**
 * Storage interface for platform-agnostic favorites persistence
 */
export interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
