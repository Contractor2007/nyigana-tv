'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

export function useHLSPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBitrate, setCurrentBitrate] = useState(0);
  const [bufferStatus, setBufferStatus] = useState(0);

  const loadStream = useCallback((url: string) => {
    if (!videoRef.current) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        debug: false,
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        videoRef.current?.play();
        setIsPlaying(true);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          setIsLoading(false);
          setError('Failed to load stream');
          
          // Try fallback
          if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = url;
            videoRef.current.addEventListener('loadedmetadata', () => {
              videoRef.current?.play();
              setIsPlaying(true);
              setIsLoading(false);
            });
          }
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        if (data.details) {
          const bitrate = Math.round(
            (data.details.totalbytes / data.details.totalduration) * 8 / 1000
          );
          setCurrentBitrate(bitrate);
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play();
        setIsPlaying(true);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
      setError('HLS not supported in this browser');
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  // Monitor buffer status
  useEffect(() => {
    const updateBufferStatus = () => {
      if (videoRef.current && videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(
          videoRef.current.buffered.length - 1
        );
        const duration = videoRef.current.duration;
        const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
        setBufferStatus(Math.round(bufferPercent));
      }
    };

    const interval = setInterval(updateBufferStatus, 1000);
    updateBufferStatus(); // Initial call

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    isLoading,
    error,
    currentBitrate,
    bufferStatus,
    loadStream,
    togglePlay,
    toggleFullscreen,
    toggleMute,
  };
}