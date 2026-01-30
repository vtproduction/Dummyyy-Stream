import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannels } from '../hooks/useChannels';
import { useKeyboardNavigation, useScrollIntoView } from '../hooks/useKeyboardNavigation';
import ChannelCard from '../components/ChannelCard';
import './ChannelListScreen.css';

const GRID_COLUMNS = 6;

export default function ChannelListScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const { channels, loading, toggleFavorite, isFavorite } = useChannels();
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

  return (
    <div className="screen channel-list-screen">
      <header className="channel-list-screen__header">
        <h1>Dummyyy Stream</h1>
        <p className="channel-list-screen__hint">
          ← → ↑ ↓ Navigate • Enter: Play • F: Favorite
        </p>
      </header>
      
      <div className="channel-list-screen__grid" ref={containerRef}>
        {channels.map((channel, index) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isFocused={index === focusedIndex}
            isFavorite={isFavorite(channel.id)}
            onSelect={() => handleSelect(index)}
            onFavorite={() => handleFavorite(index)}
            setRef={(el) => setItemRef(index, el)}
          />
        ))}
      </div>
    </div>
  );
}
