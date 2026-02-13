import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { useChannels } from '../hooks/useChannels';

import './PlayerScreen.css';

type PlayerState = 'loading' | 'playing' | 'paused' | 'error';

export default function PlayerScreen() {
  const { id } = useParams<{ id: string }>();
  // ... (rest of imports and component logic) ...

  // Inside return statement

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const { getChannelById, getAdjacentChannel, toggleFavorite, isFavorite, loading: channelsLoading } = useChannels();
  const channel = id ? getChannelById(id) : null;

  const [playerState, setPlayerState] = useState<PlayerState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      if (playerState === 'playing') {
        setShowControls(false);
      }
    }, 2000);
  }, [playerState]);

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    const url = channel.url;
    setPlayerState('loading');
    setErrorMessage('');

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if native HLS is supported (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play()
        .then(() => setPlayerState('playing'))
        .catch(() => {
          setPlayerState('error');
          setErrorMessage('Failed to play stream');
        });
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play()
          .then(() => setPlayerState('playing'))
          .catch(() => {
            setPlayerState('error');
            setErrorMessage('Failed to start playback');
          });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlayerState('error');
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage('Network error - check your connection');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage('Media error - stream may be unavailable');
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage('Playback error');
          }
        }
      });
    } else {
      setPlayerState('error');
      setErrorMessage('HLS not supported on this device');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setPlaying = () => setPlayerState('playing');
    const onPlay = () => {
      setPlaying();
      resetHideTimer();
    };
    const onPause = () => setPlayerState('paused');
    const onWaiting = () => setPlayerState('loading');

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', setPlaying);
    video.addEventListener('canplay', setPlaying);
    video.addEventListener('canplaythrough', setPlaying);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', setPlaying);
      video.removeEventListener('canplay', setPlaying);
      video.removeEventListener('canplaythrough', setPlaying);
    };
  }, [resetHideTimer]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();

      switch (e.key) {
        case ' ':
        case 'Enter': {
          e.preventDefault();
          const video = videoRef.current;
          if (video) {
            video.paused ? video.play() : video.pause();
          }
          break;
        }
        case 'ArrowUp': {
          // D-Pad Up on LG TV remote - toggle favorite
          e.preventDefault();
          if (id) toggleFavorite(id);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (id) {
            const prev = getAdjacentChannel(id, 'prev');
            if (prev) navigate(`/play/${prev.id}`);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (id) {
            const next = getAdjacentChannel(id, 'next');
            if (next) navigate(`/play/${next.id}`);
          }
          break;
        }
        case 'Escape':
        case 'Backspace': {
          e.preventDefault();
          navigate('/');
          break;
        }
        case 'f':
        case 'F': {
          e.preventDefault();
          if (id) toggleFavorite(id);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, navigate, getAdjacentChannel, toggleFavorite, resetHideTimer]);

  // Mouse movement shows controls
  useEffect(() => {
    const handleMouseMove = () => resetHideTimer();
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [resetHideTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Show loading while channels are being fetched
  if (channelsLoading) {
    return (
      <div className="screen player-screen">
        <div className="player-screen__overlay">
          <div className="player-screen__spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="screen player-screen">
        <div className="player-screen__error">
          <p>Channel not found</p>
          <button onClick={() => navigate('/')}>Back to channels</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen player-screen" onClick={resetHideTimer}>
      <video
        ref={videoRef}
        className="player-screen__video"
        playsInline
        autoPlay
      />

      {/* Loading overlay */}
      {playerState === 'loading' && (
        <div className="player-screen__overlay">
          <div className="player-screen__spinner" />
          <p>Loading {channel.name}...</p>
        </div>
      )}

      {/* Error overlay */}
      {playerState === 'error' && (
        <div className="player-screen__overlay player-screen__overlay--error">
          <p className="player-screen__error-text">{errorMessage}</p>
          <button onClick={() => navigate('/')}>Back to channels</button>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`player-screen__controls ${showControls ? 'visible' : ''}`}>
        <div className="player-screen__top">
          <button className="player-screen__back" onClick={() => navigate('/')}>
            ← Back
          </button>
          <button
            className="player-screen__favorite-btn"
            onClick={() => id && toggleFavorite(id)}
            title={id && isFavorite(id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {id && isFavorite(id) ? '★' : '☆'}
          </button>
          <div className="player-screen__channel-info">
            <img src={channel.logo} alt="" className="player-screen__logo" />
            <span className="player-screen__name">{channel.name}</span>
          </div>
        </div>
        
        <div className="player-screen__bottom">
          <div className="player-screen__hints">
            <span>Space: Play/Pause</span>
            <span>←/→: Prev/Next Channel</span>
            <span>↑/F: Favorite</span>
            <span>Esc: Back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
