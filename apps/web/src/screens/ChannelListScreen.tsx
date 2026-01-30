import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import type { SortOption } from '../hooks/useChannels';
import { useKeyboardNavigation, useScrollIntoView } from '../hooks/useKeyboardNavigation';
import ChannelCard from '../components/ChannelCard';
import './ChannelListScreen.css';

const GRID_COLUMNS = 6;

const SORT_LABELS: Record<SortOption, string> = {
  'default': 'Default',
  'name-asc': 'Name (A-Z)',
  'name-desc': 'Name (Z-A)',
  'favorites-only': 'Favorites Only',
};

export default function ChannelListScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  const { 
    channels, 
    favoriteChannels, 
    otherChannels, 
    loading, 
    toggleFavorite, 
    isFavorite,
    sortOption,
    changeSortOption,
  } = useChannels();
  
  const { setItemRef } = useScrollIntoView(focusedIndex, containerRef);

  const handleSelect = useCallback(
    (index: number) => {
      const channel = channels[index];
      if (channel) {
        navigate(`/play/${channel.id}`);
      }
    },
    [channels, navigate]
  );

  const handleFavorite = useCallback(
    (index: number) => {
      const channel = channels[index];
      if (channel) {
        toggleFavorite(channel.id);
      }
    },
    [channels, toggleFavorite]
  );

  const handleSortChange = useCallback((option: SortOption) => {
    changeSortOption(option);
    setShowSortMenu(false);
    setFocusedIndex(0); // Reset focus when sort changes
  }, [changeSortOption]);

  useKeyboardNavigation({
    itemCount: channels.length,
    columns: GRID_COLUMNS,
    focusedIndex,
    onFocusChange: setFocusedIndex,
    onSelect: handleSelect,
    onFavorite: handleFavorite,
  });

  if (loading) {
    return (
      <div className="screen channel-list-screen">
        <div className="loading">Loading channels...</div>
      </div>
    );
  }

  // Calculate index offset for the "other" section
  const favoriteCount = favoriteChannels.length;

  return (
    <div className="screen channel-list-screen">
      <header className="channel-list-screen__header">
        <div className="channel-list-screen__title-row">
          <h1>ZapTV</h1>
          <div className="channel-list-screen__sort-container">
            <button 
              className="channel-list-screen__sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              Sort: {SORT_LABELS[sortOption]} ▼
            </button>
            {showSortMenu && (
              <div className="channel-list-screen__sort-menu">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    className={`channel-list-screen__sort-option ${sortOption === option ? 'active' : ''}`}
                    onClick={() => handleSortChange(option)}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="channel-list-screen__hint">
          ← → ↑ ↓ Navigate • Enter: Play • F: Favorite
        </p>
      </header>
      
      <div className="channel-list-screen__content" ref={containerRef}>
        {/* Favorites Section */}
        {favoriteChannels.length > 0 && (
          <section className="channel-list-screen__section">
            <h2 className="channel-list-screen__section-title">
              ★ Favorites ({favoriteChannels.length})
            </h2>
            <div className="channel-list-screen__grid">
              {favoriteChannels.map((channel, index) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isFocused={index === focusedIndex}
                  isFavorite={true}
                  onSelect={() => handleSelect(index)}
                  onFavorite={() => handleFavorite(index)}
                  setRef={(el) => setItemRef(index, el)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Channels Section (or remaining channels) */}
        {otherChannels.length > 0 && (
          <section className="channel-list-screen__section">
            <h2 className="channel-list-screen__section-title">
              All Channels ({otherChannels.length})
            </h2>
            <div className="channel-list-screen__grid">
              {otherChannels.map((channel, index) => {
                const globalIndex = favoriteCount + index;
                return (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isFocused={globalIndex === focusedIndex}
                    isFavorite={isFavorite(channel.id)}
                    onSelect={() => handleSelect(globalIndex)}
                    onFavorite={() => handleFavorite(globalIndex)}
                    setRef={(el) => setItemRef(globalIndex, el)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state for favorites-only mode */}
        {favoriteChannels.length === 0 && sortOption === 'favorites-only' && (
          <div className="channel-list-screen__empty">
            <p>No favorite channels yet.</p>
            <p>Press "F" on any channel to add it to favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
}
