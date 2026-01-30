import { useState, useEffect, useCallback } from 'react';
import type { Channel, RawChannel, Storage } from '@dummyyy/channels';
import {
  loadChannels,
  loadFavoriteIds,
  saveFavoriteIds,
  sortChannelsWithFavorites,
} from '@dummyyy/channels';
import channelsData from '../../../../packages/channels/data/channels.json';

// localStorage adapter for web
const webStorage: Storage = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => localStorage.setItem(key, value),
};

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load channels and favorites on mount
  useEffect(() => {
    const init = async () => {
      try {
        const rawChannels = channelsData as RawChannel[];
        const loadedChannels = loadChannels(rawChannels);
        const loadedFavorites = await loadFavoriteIds(webStorage);
        
        setFavoriteIds(loadedFavorites);
        setChannels(sortChannelsWithFavorites(loadedChannels, loadedFavorites));
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Toggle favorite and re-sort
  const toggleFavorite = useCallback(async (channelId: string) => {
    setFavoriteIds((prev) => {
      const newFavorites = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      
      // Save to storage
      saveFavoriteIds(webStorage, newFavorites);
      
      // Re-sort channels
      setChannels(() => {
        const allChannels = loadChannels(channelsData as RawChannel[]);
        return sortChannelsWithFavorites(allChannels, newFavorites);
      });
      
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback(
    (channelId: string) => favoriteIds.includes(channelId),
    [favoriteIds]
  );

  const getChannelById = useCallback(
    (id: string) => channels.find((c) => c.id === id),
    [channels]
  );

  const getAdjacentChannel = useCallback(
    (currentId: string, direction: 'next' | 'prev') => {
      const index = channels.findIndex((c) => c.id === currentId);
      if (index === -1) return null;
      
      const newIndex = direction === 'next' 
        ? (index + 1) % channels.length
        : (index - 1 + channels.length) % channels.length;
      
      return channels[newIndex];
    },
    [channels]
  );

  return {
    channels,
    loading,
    favoriteIds,
    toggleFavorite,
    isFavorite,
    getChannelById,
    getAdjacentChannel,
  };
}
