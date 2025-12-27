'use client'
import { useState, useRef, useCallback, useEffect } from 'react';
import Hls from 'hls.js';
import { getBestStreamUrl } from '@/lib/stream-utils';

export const useHLSPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBitrate, setCurrentBitrate] = useState(0);
  const [bufferStatus, setBufferStatus] = useState(0);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('');

  // Helper to calculate buffer status
  const updateBufferStatus = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.buffered.length || !video.duration) return;
    
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const duration = video.duration || 1;
    const status = Math.round((bufferedEnd / duration) * 100);
    setBufferStatus(Math.min(100, Math.max(0, status)));
  }, []);

  const loadStream = useCallback(async (url: string) => {
    if (!videoRef.current) return;

    console.log('Loading stream:', url);
    setError(null);
    setIsLoading(true);
    setBufferStatus(0);
    setCurrentBitrate(0);

    const video = videoRef.current;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset video and remove all event listeners
    video.removeAttribute('src');
    video.load();

    try {
      // Get the best available stream URL
      const streamUrl = await getBestStreamUrl(url);
      setCurrentStreamUrl(streamUrl);

      // Check if using proxy (don't use HLS.js for proxy URLs)
      const isProxyUrl = streamUrl.includes('/api/proxy');

      if (Hls.isSupported() && !isProxyUrl) {
        console.log('Using HLS.js for:', streamUrl);
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          debug: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          xhrSetup: (xhr, xhrUrl) => {
            // Rewrite segment URLs to use proxy if needed
            if (xhrUrl.startsWith('http://')) {
              const proxyUrl = `/api/proxy?url=${encodeURIComponent(xhrUrl)}`;
              xhr.open('GET', proxyUrl, true);
              return false;
            }
            return true;
          },
        });

        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.log('Autoplay failed:', err);
            setError('Click play to start stream');
            setIsPlaying(false);
          });
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          if (data?.level !== undefined && hls.levels?.[data.level]) {
            const level = hls.levels[data.level];
            setCurrentBitrate(level.bitrate);
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          updateBufferStatus();
        });

        hls.on(Hls.Events.BUFFER_FLUSHED, () => {
          updateBufferStatus();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          
          if (data.fatal) {
            setIsLoading(false);
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                setError('Stream error. Trying alternative...');
                hls.destroy();
                // Try fallback with proxy
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
                video.src = proxyUrl;
                video.load();
                video.play().then(() => {
                  setIsPlaying(true);
                }).catch(() => {
                  setError('Failed to load stream');
                });
                break;
            }
          }
        });

        // Listen to video events for HLS.js
        video.addEventListener('play', () => setIsPlaying(true));
        video.addEventListener('pause', () => setIsPlaying(false));
        video.addEventListener('waiting', () => setIsLoading(true));
        video.addEventListener('playing', () => setIsLoading(false));

      } else {
        // Use native video element (for proxy URLs or Safari)
        console.log('Using native video for:', streamUrl);
        video.src = streamUrl;
        
        // Setup event listeners for native playback
        const handleLoadedMetadata = () => {
          console.log('Native video loaded');
          setIsLoading(false);
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((err) => {
            console.log('Native autoplay failed:', err);
            setError('Click play to start stream');
            setIsPlaying(false);
          });
        };

        const handleError = (e: Event) => {
          setIsLoading(false);
          console.error('Native video error:', video.error);
          setError(`Video error: ${video.error?.message || 'Unknown error'}`);
        };

        const handleProgress = () => {
          updateBufferStatus();
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
        video.addEventListener('progress', handleProgress);
        video.addEventListener('play', () => setIsPlaying(true));
        video.addEventListener('pause', () => setIsPlaying(false));
        video.addEventListener('waiting', () => setIsLoading(true));
        video.addEventListener('playing', () => setIsLoading(false));

        // Cleanup function for this path
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          video.removeEventListener('progress', handleProgress);
          video.removeEventListener('play', () => setIsPlaying(true));
          video.removeEventListener('pause', () => setIsPlaying(false));
          video.removeEventListener('waiting', () => setIsLoading(true));
          video.removeEventListener('playing', () => setIsLoading(false));
        };
      }

    } catch (err: any) {
      console.error('Failed to load stream:', err);
      setIsLoading(false);
      setError(`Failed to load stream: ${err.message}`);
    }
  }, [updateBufferStatus]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Play failed:', err);
        setError('Playback failed. Click to retry.');
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const container = videoRef.current?.parentElement || document.documentElement;
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
      videoRef.current.muted = volume === 0;
    }
  }, []);

  // Setup video event listeners on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleProgress = () => updateBufferStatus();

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('progress', handleProgress);
    };
  }, [updateBufferStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    setIsPlaying,
    isLoading,
    error,
    setError,
    currentBitrate,
    bufferStatus,
    currentStreamUrl,
    loadStream,
    togglePlay,
    toggleFullscreen,
    toggleMute,
    setVolume,
  };
};