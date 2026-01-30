import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Channel, RawChannel, Storage } from '@dummyyy/channels';
import {
  loadChannels,
  loadFavoriteIds,
  saveFavoriteIds,
} from '@dummyyy/channels';
import channelsData from '../../../../packages/channels/data/channels.json';

// localStorage adapter for web
const webStorage: Storage = {
  getItem: async (key: string) => localStorage.getItem(key),
  setItem: async (key: string, value: string) => localStorage.setItem(key, value),
};

export type SortOption = 'default' | 'name-asc' | 'name-desc' | 'favorites-only';

const SORT_KEY = 'channelSortOption';

export function useChannels() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Load channels, favorites, and saved sort option on mount
  useEffect(() => {
    const init = async () => {
      try {
        const rawChannels = channelsData as RawChannel[];
        const loadedChannels = loadChannels(rawChannels);
        const loadedFavorites = await loadFavoriteIds(webStorage);
        const savedSort = localStorage.getItem(SORT_KEY) as SortOption | null;
        
        setAllChannels(loadedChannels);
        setFavoriteIds(loadedFavorites);
        if (savedSort) {
          setSortOption(savedSort);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Compute favorite and non-favorite channels separately
  const { favoriteChannels, otherChannels, displayChannels } = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    const favorites = allChannels.filter(c => favoriteSet.has(c.id));
    const others = allChannels.filter(c => !favoriteSet.has(c.id));

    // Apply sorting based on sortOption
    const sortByName = (a: Channel, b: Channel) => a.name.localeCompare(b.name);
    const sortByNameDesc = (a: Channel, b: Channel) => b.name.localeCompare(a.name);

    let sortedFavorites: Channel[];
    let sortedOthers: Channel[];

    switch (sortOption) {
      case 'name-asc':
        sortedFavorites = [...favorites].sort(sortByName);
        sortedOthers = [...others].sort(sortByName);
        break;
      case 'name-desc':
        sortedFavorites = [...favorites].sort(sortByNameDesc);
        sortedOthers = [...others].sort(sortByNameDesc);
        break;
      case 'favorites-only':
        sortedFavorites = [...favorites].sort(sortByName);
        sortedOthers = [];
        break;
      case 'default':
      default:
        // Default: keep original order but favorites first
        sortedFavorites = favorites;
        sortedOthers = others;
        break;
    }

    // For navigation purposes, combine all displayed channels
    const all = [...sortedFavorites, ...sortedOthers];

    return {
      favoriteChannels: sortedFavorites,
      otherChannels: sortedOthers,
      displayChannels: all,
    };
  }, [allChannels, favoriteIds, sortOption]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (channelId: string) => {
    setFavoriteIds((prev) => {
      const newFavorites = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      
      // Save to storage
      saveFavoriteIds(webStorage, newFavorites);
      
      return newFavorites;
    });
  }, []);

  // Change sort option
  const changeSortOption = useCallback((option: SortOption) => {
    setSortOption(option);
    localStorage.setItem(SORT_KEY, option);
  }, []);

  const isFavorite = useCallback(
    (channelId: string) => favoriteIds.includes(channelId),
    [favoriteIds]
  );

  const getChannelById = useCallback(
    (id: string) => displayChannels.find((c) => c.id === id),
    [displayChannels]
  );

  const getAdjacentChannel = useCallback(
    (currentId: string, direction: 'next' | 'prev') => {
      const index = displayChannels.findIndex((c) => c.id === currentId);
      if (index === -1) return null;
      
      const newIndex = direction === 'next' 
        ? (index + 1) % displayChannels.length
        : (index - 1 + displayChannels.length) % displayChannels.length;
      
      return displayChannels[newIndex];
    },
    [displayChannels]
  );

  return {
    channels: displayChannels,
    favoriteChannels,
    otherChannels,
    loading,
    favoriteIds,
    sortOption,
    toggleFavorite,
    changeSortOption,
    isFavorite,
    getChannelById,
    getAdjacentChannel,
  };
}
