import { memo, useState, useCallback, useEffect } from 'react';
import type { Channel } from '@dummyyy/channels';

import './ChannelCard.css';

interface ChannelCardProps {
  channel: Channel;
  isFocused: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  setRef: (element: HTMLElement | null) => void;
}

// Lazy load image with placeholder
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Use the direct URL (now local)
  const activeSrc = src;

  // Reset state when src changes
  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => setError(true), []);

  if (error) {
    return (
      <div className="channel-card__placeholder">
        <span>{alt.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading="lazy"
      onLoad={handleLoad}
      onError={handleError}
      className={loaded ? 'loaded' : ''}
    />
  );
}


function ChannelCard({
  channel,
  isFocused,
  isFavorite,
  onSelect,
  onFavorite,
  setRef,
}: ChannelCardProps) {
  return (
    <div
      ref={setRef}
      className={`channel-card ${isFocused ? 'channel-card--focused' : ''}`}
      onClick={onSelect}
      tabIndex={isFocused ? 0 : -1}
      role="button"
      aria-label={`${channel.name}${isFavorite ? ' (favorite)' : ''}`}
    >
      <div className="channel-card__image">
        <LazyImage src={channel.logo} alt={channel.name} />
        {isFavorite && (
          <div className="channel-card__favorite" onClick={(e) => { e.stopPropagation(); onFavorite(); }}>
            ★
          </div>
        )}
      </div>
      <div className="channel-card__info">
        <span className="channel-card__name">{channel.name}</span>
      </div>
      {isFocused && (
        <div className="channel-card__hint">
          <span>Enter: Play</span>
          <span>F: {isFavorite ? 'Unfavorite' : 'Favorite'}</span>
        </div>
      )}
    </div>
  );
}

export default memo(ChannelCard);
