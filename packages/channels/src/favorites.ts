import type { Channel, Storage } from './types';

const FAVORITES_KEY = 'favoriteChannelIds';

/**
 * Load favorite channel IDs from storage
 */
export async function loadFavoriteIds(storage: Storage): Promise<string[]> {
  try {
    const data = await storage.getItem(FAVORITES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load favorites:', error);
  }
  return [];
}

/**
 * Save favorite channel IDs to storage
 */
export async function saveFavoriteIds(
  storage: Storage,
  ids: string[]
): Promise<void> {
  try {
    await storage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}

/**
 * Sort channels with favorites first, then alphabetically by name
 */
export function sortChannelsWithFavorites(
  channels: Channel[],
  favoriteIds: string[]
): Channel[] {
  const favoriteSet = new Set(favoriteIds);

  return [...channels].sort((a, b) => {
    const aIsFavorite = favoriteSet.has(a.id);
    const bIsFavorite = favoriteSet.has(b.id);

    // Favorites come first
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Then sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}
