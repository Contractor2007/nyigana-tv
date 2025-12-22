'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date | null;
  latency: number | null;
  connectionType: string;
}

export function useConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: true,
    lastChecked: null,
    latency: null,
    connectionType: 'unknown'
  });

  const [bufferStatus, setBufferStatus] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00:00');

  // Check connection status
  const checkConnection = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      // Try to fetch a small resource
      await fetch('https://www.gstatic.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-store'
      });
      
      const latency = Date.now() - startTime;
      
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastChecked: new Date(),
        latency,
        connectionType: navigator.connection?.effectiveType || 'unknown'
      }));
    } catch {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date(),
        latency: null,
        connectionType: 'offline'
      }));
    }
  }, []);

  // Monitor video buffer
  const monitorBuffer = useCallback((videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    const updateBuffer = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(
          videoElement.buffered.length - 1
        );
        const duration = videoElement.duration;
        const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
        setBufferStatus(Math.round(bufferPercent));
      }
    };

    videoElement.addEventListener('progress', updateBuffer);
    videoElement.addEventListener('timeupdate', updateBuffer);

    return () => {
      videoElement.removeEventListener('progress', updateBuffer);
      videoElement.removeEventListener('timeupdate', updateBuffer);
    };
  }, []);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      checkConnection();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();
    const connectionInterval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionInterval);
    };
  }, [checkConnection]);

  return {
    status,
    bufferStatus,
    currentTime,
    checkConnection,
    monitorBuffer
  };
}