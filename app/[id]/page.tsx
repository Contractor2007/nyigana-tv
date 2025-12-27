'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute,
  FaExpand, FaCompress, FaCircle, FaSpinner,
  FaExclamationTriangle, FaSignal, FaWifi,
  FaKeyboard, FaInfoCircle, FaCog, FaArrowLeft,
  FaVolumeOff, FaVolumeDown
} from 'react-icons/fa';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';
import { useHLSPlayer } from '@/hooks/useHLSPlayer';
import { useStreams } from '@/hooks/useStreams';

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const infoPanelRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Player states
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // UI states
  const [showControls, setShowControls] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [streamQuality, setStreamQuality] = useState('Auto');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showVolumeHint, setShowVolumeHint] = useState(true);
  const [isMouseActive, setIsMouseActive] = useState(false);

  // Use custom hooks
  const { getChannelById } = useStreams();
  const { 
    videoRef, 
    isPlaying, 
    isLoading: isBuffering, 
    error: streamError, 
    currentBitrate, 
    bufferStatus,
    loadStream, 
    togglePlay, 
    toggleFullscreen: hookToggleFullscreen, 
    toggleMute: hookToggleMute 
  } = useHLSPlayer();

  const { 
    status: connectionStatus, 
    bufferStatus: hookBufferStatus,
    currentTime: currentClockTime,
    checkConnection,
    monitorBuffer 
  } = useConnectionMonitor();

  // Get channel from useStreams hook
  useEffect(() => {
    const loadChannel = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Wait a bit to ensure streams are loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const ch = getChannelById(id);
        
        if (!ch) {
          throw new Error('Channel not found');
        }
        
        setChannel(ch);
      } catch (err: any) {
        console.error('Failed to load channel:', err);
        setError(err.message || 'Failed to load channel');
        
        // Try direct fetch as fallback
        try {
          console.log('Trying direct fetch as fallback...');
          const response = await fetch('/streams.json');
          if (response.ok) {
            const data = await response.json();
            const channels = Array.isArray(data) ? data : data.channels || [];
            const ch = channels.find((c: any) => String(c.id) === String(id));
            if (ch) {
              setChannel(ch);
              setError('');
            }
          }
        } catch (fetchErr) {
          console.error('Fallback fetch failed:', fetchErr);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadChannel();
    }
  }, [id, getChannelById]);

  // Initialize stream when channel is loaded
  useEffect(() => {
    if (!channel || !videoRef.current) return;

    const video = videoRef.current;
    // Set volume but DO NOT mute by default
    video.volume = volume;
    video.muted = false; // Explicitly set to not muted
    
    // Set up buffer monitoring
    const cleanupBufferMonitor = monitorBuffer(video);

    // Load the stream
    loadStream(channel.url);

    // Show volume control hint for 3 seconds
    setTimeout(() => setShowVolumeHint(false), 3000);

    return () => {
      if (cleanupBufferMonitor) cleanupBufferMonitor();
    };
  }, [channel, volume, loadStream, monitorBuffer]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      // Reset mouse activity state when entering fullscreen
      if (isNowFullscreen) {
        setIsMouseActive(false);
        setShowControls(false);
      } else {
        setIsMouseActive(true);
        setShowControls(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Update time and buffer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, []);

  // Auto-hide controls and reset mouse activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    setIsMouseActive(true);
    setShowControls(true);
    
    // Only hide controls in fullscreen mode after inactivity
    if (isFullscreen) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsMouseActive(false);
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen]);

  // Auto-hide controls on inactivity
  useEffect(() => {
    if (showInfoPanel || showKeyboardShortcuts || !isFullscreen) return;
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [showControls, showInfoPanel, showKeyboardShortcuts, isFullscreen, resetInactivityTimer]);

  // Hide volume hint after 5 seconds
  useEffect(() => {
    if (showVolumeHint) {
      const timer = setTimeout(() => {
        setShowVolumeHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showVolumeHint]);

  // Hide volume slider after delay
  useEffect(() => {
    if (showVolumeSlider) {
      const timer = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showVolumeSlider]);

  // Enhanced toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!document.fullscreenElement);
  }, []);

  // Enhanced mute toggle
  const handleMuteToggle = useCallback(() => {
    hookToggleMute();
    if (videoRef.current) {
      const newMutedState = videoRef.current.muted;
      setIsMuted(newMutedState);
      
      if (!newMutedState) {
        setShowVolumeSlider(true);
      }
      
      setShowVolumeHint(false);
    }
  }, [hookToggleMute]);

  // Enhanced volume change
  const handleVolumeChangeDirect = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    setShowVolumeHint(false);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    handleVolumeChangeDirect(vol);
  }, [handleVolumeChangeDirect]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Reset inactivity timer on any key press
      resetInactivityTimer();

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          if (showInfoPanel) setShowInfoPanel(false);
          if (showKeyboardShortcuts) setShowKeyboardShortcuts(false);
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime += 10;
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime -= 10;
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChangeDirect(Math.min(1, volume + 0.1));
          setShowVolumeSlider(true);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChangeDirect(Math.max(0, volume - 0.1));
          setShowVolumeSlider(true);
          break;
        case 'i':
          e.preventDefault();
          setShowInfoPanel(!showInfoPanel);
          break;
        case '/':
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showInfoPanel, showKeyboardShortcuts, volume, togglePlay, handleMuteToggle, toggleFullscreen, handleVolumeChangeDirect, resetInactivityTimer]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const percent = parseFloat(e.target.value);
    video.currentTime = (percent / 100) * video.duration;
    setCurrentTime(video.currentTime);
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    if (!showInfoPanel && !showKeyboardShortcuts) {
      resetInactivityTimer();
    }
  };

  // Determine connection quality from hook
  const getConnectionQuality = () => {
    if (!connectionStatus.isOnline) return 'poor';
    if (connectionStatus.latency && connectionStatus.latency > 500) return 'fair';
    return 'good';
  };

  const connectionQuality = getConnectionQuality();

  // Determine VolumeIcon
  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  // Custom scrollbar styles for info panel
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      .fade-in-out {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }
      
      .fade-in-out.hidden {
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Calculate if UI should be visible
  const shouldShowUI = !isFullscreen || isMouseActive || showControls;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-300 text-lg">Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Channel Unavailable</h2>
          <p className="text-gray-400 mb-4">{error || 'Channel not found'}</p>
          <div className="space-y-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              <FaArrowLeft /> Back to Channels
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Always visible when not in fullscreen, hidden in fullscreen unless mouse active */}
      <header className={`fixed top-0 left-0 right-0 z-30 p-6 transition-all duration-300 ${
        !isFullscreen ? 'opacity-100' : isMouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-lg font-semibold">Back to Channels</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaSignal className={`${connectionQuality === 'good' ? 'text-green-500' : connectionQuality === 'fair' ? 'text-yellow-500' : 'text-red-500'}`} />
              <span className="text-sm">
                {connectionQuality === 'good' ? 'Excellent' : connectionQuality === 'fair' ? 'Good' : 'Poor'}
              </span>
            </div>
            
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Keyboard Shortcuts"
            >
              <FaKeyboard />
            </button>
          </div>
        </div>
      </header>

      {/* Main Player Container */}
      <div 
        ref={containerRef}
        className="relative bg-black w-full h-screen"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isFullscreen && !showInfoPanel && !showKeyboardShortcuts) {
            // Don't immediately hide when leaving container in fullscreen
            // Let the inactivity timer handle it
          }
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={() => {
            togglePlay();
            resetInactivityTimer();
          }}
        />

        {/* Buffering Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-white mb-4 mx-auto" />
              <p className="text-gray-300">Buffering...</p>
              <div className="w-64 h-1 bg-gray-700 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${bufferStatus}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Volume Indicator */}
        {showVolumeSlider && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-black/90 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <VolumeIcon />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-40 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-lg font-medium">{Math.round(volume * 100)}%</span>
            </div>
          </div>
        )}

        

        {/* Controls Overlay */}
        <div 
          ref={controlsRef}
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-all duration-300 ${
            shouldShowUI ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="relative w-full h-1.5 bg-gray-700/50 rounded-full mb-2">
              <div 
                className="absolute h-full bg-gray-500/50 rounded-full"
                style={{ width: `${bufferStatus}%` }}
              />
              
              <div 
                className="absolute h-full bg-red-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={(currentTime / duration) * 100 || 0}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                onClick={resetInactivityTimer}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Play/Pause */}
              <button
                onClick={() => {
                  togglePlay();
                  resetInactivityTimer();
                }}
                className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                {isPlaying ? (
                  <FaPause className="text-black text-xl" />
                ) : (
                  <FaPlay className="text-black text-xl ml-1" />
                )}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleMuteToggle();
                    resetInactivityTimer();
                  }}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                  title={isMuted ? "Unmute (M)" : "Mute (M)"}
                >
                  <VolumeIcon />
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    handleVolumeChange(e);
                    resetInactivityTimer();
                  }}
                  className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Time Display */}
              <div className="text-lg font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Live Indicator */}
              {channel.isLive && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-600/30 border border-red-500/50 rounded-full">
                  <FaCircle className="text-red-500 animate-pulse text-xs" />
                  <span className="text-sm font-bold">LIVE NOW</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Playback Speed */}
              <div className="relative group">
                <button 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
                  onClick={resetInactivityTimer}
                >
                  {playbackRate}x Speed
                </button>
                
                <div 
                  className="absolute bottom-full right-0 mb-2 bg-black/95 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity min-w-40 hide-scrollbar overflow-y-auto max-h-60 custom-scrollbar"
                  onMouseEnter={resetInactivityTimer}
                >
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => {
                        changePlaybackRate(rate);
                        resetInactivityTimer();
                      }}
                      className={`block w-full text-left px-4 py-3 hover:bg-white/10 rounded-lg transition-colors ${
                        playbackRate === rate ? 'text-red-500 bg-white/5' : ''
                      }`}
                    >
                      {rate}x Speed
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Button */}
              <button
                onClick={() => {
                  setShowInfoPanel(true);
                  resetInactivityTimer();
                }}
                className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                title="Channel Info (I)"
              >
                <FaInfoCircle className="text-xl" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => {
                  toggleFullscreen();
                  resetInactivityTimer();
                }}
                className="p-3 hover:bg-white/10 rounded-xl transition-colors"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
              >
                {isFullscreen ? <FaCompress className="text-xl" /> : <FaExpand className="text-xl" />}
              </button>
            </div>
          </div>
        </div>

        
      </div>

      {/* Channel Info Panel */}
      {showInfoPanel && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div 
            ref={infoPanelRef}
            className="bg-gray-900/95 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <FaInfoCircle className="text-red-500" />
                  Channel Information
                </h2>
                <button
                  onClick={() => setShowInfoPanel(false)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Channel Name</div>
                    <div className="text-2xl font-semibold">{channel.title}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Description</div>
                    <div className="text-gray-300 text-lg">{channel.description}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Status</div>
                    <div className="flex items-center gap-3">
                      <FaCircle className={`text-xl ${channel.isLive ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
                      <span className="text-xl font-medium">{channel.isLive ? 'Live Now' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Region</div>
                      <div className="text-xl">{channel.region}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Category</div>
                      <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl inline-block">
                        {channel.category}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Quality</div>
                      <div className="text-xl">{channel.quality}</div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Network</div>
                      <div className="text-xl">{channel.network}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-sm mb-2">Country</div>
                    <div className="text-2xl">{channel.country_code}</div>
                  </div>
                  
                  {channel.viewers && (
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Viewers</div>
                      <div className="flex items-center gap-3">
                        <FaWifi className="text-green-500 text-xl" />
                        <span className="text-2xl font-bold">{channel.viewers.toLocaleString()}</span>
                        <span className="text-gray-400">watching</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/10">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <FaCog className="text-gray-400" />
                  Stream Information
                </h3>
                <div className="bg-black/50 p-6 rounded-xl">
                  <div className="font-mono text-sm break-all bg-black/30 p-4 rounded-lg">
                    {channel.url}
                  </div>
                  <div className="flex flex-wrap gap-6 mt-6 text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Type:</span>
                      <span>{channel.type?.toUpperCase() || 'HLS'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Bitrate:</span>
                      <span>{currentBitrate > 0 ? `${currentBitrate} kbps` : 'Calculating...'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Playback:</span>
                      <span>{playbackRate}x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Volume:</span>
                      <span>{Math.round(volume * 100)}%</span>
                      <span>{isMuted ? '(Muted)' : '(Unmuted)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Encryption:</span>
                      <span>{channel.encryption ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-gray-400 text-sm mb-2">Languages</div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(channel.language) ? channel.language.map((lang: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-gray-800/50 rounded-full text-sm">
                          {lang}
                        </span>
                      )) : (
                        <span className="px-3 py-1 bg-gray-800/50 rounded-full text-sm">
                          {channel.language || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </div>
                  {Array.isArray(channel.tags) && channel.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="text-gray-400 text-sm mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {channel.tags.map((tag: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {tag}
                        </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
                    <FaKeyboard className="text-red-500" />
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-gray-400">Quick controls for better viewing experience</p>
                </div>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="p-3 hover:bg-white/10 rounded-xl transition-colors text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Play/Pause</span>
                      <p className="text-sm text-gray-400">Toggle playback</p>
                    </div>
                    <div className="flex gap-2">
                      <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">Space</kbd>
                      <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">K</kbd>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Toggle Mute</span>
                      <p className="text-sm text-gray-400">Mute/Unmute audio</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">M</kbd>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Volume Up</span>
                      <p className="text-sm text-gray-400">Increase volume by 10%</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">↑</kbd>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Volume Down</span>
                      <p className="text-sm text-gray-400">Decrease volume by 10%</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">↓</kbd>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Skip Forward</span>
                      <p className="text-sm text-gray-400">Jump 10 seconds forward</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">→</kbd>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Skip Backward</span>
                      <p className="text-sm text-gray-400">Jump 10 seconds backward</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">←</kbd>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Toggle Fullscreen</span>
                      <p className="text-sm text-gray-400">Enter/Exit fullscreen mode</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">F</kbd>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div>
                      <span className="font-medium">Channel Info</span>
                      <p className="text-sm text-gray-400">Show channel information</p>
                    </div>
                    <kbd className="px-3 py-2 bg-gray-800 rounded-lg font-mono">I</kbd>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <FaVolumeUp className="text-blue-500" />
                  <span className="font-semibold">Volume Control Tips</span>
                </div>
                <p className="text-gray-300">
                  The stream starts with audio enabled. Press <kbd className="px-2 py-1 bg-gray-800 rounded mx-1">M</kbd> 
                  anytime to toggle mute. Use <kbd className="px-2 py-1 bg-gray-800 rounded mx-1">↑</kbd> and 
                  <kbd className="px-2 py-1 bg-gray-800 rounded mx-1">↓</kbd> to adjust volume quickly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Quality Indicator - Hidden in fullscreen unless mouse active */}
      <div className={`fixed bottom-4 left-4 z-30 transition-all duration-300 ${
        !isFullscreen ? 'opacity-100' : isMouseActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm ${
          connectionQuality === 'good' ? 'bg-green-500/20 text-green-400' :
          connectionQuality === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          <FaWifi className={`text-xl ${isBuffering ? 'animate-pulse' : ''}`} />
          <div>
            <div className="font-medium">
              {connectionStatus.isOnline ? 
                connectionQuality === 'good' ? 'Excellent Connection' : 
                connectionQuality === 'fair' ? 'Good Connection' : 'Poor Connection'
              : 'Offline'}
            </div>
            <div className="text-sm opacity-80">
              {isBuffering ? 'Buffering...' : `${bufferStatus}% buffered`}
            </div>
          </div>
          {isBuffering && <FaSpinner className="animate-spin ml-2" />}
        </div>
      </div>
    </div>
  );
}