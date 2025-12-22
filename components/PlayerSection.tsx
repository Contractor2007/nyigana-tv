'use client';

import { useRef, useEffect } from 'react';
import { FaVideo, FaInfoCircle } from 'react-icons/fa';
import { Channel } from '@/types/channel';
import { useHLSPlayer } from '@/hooks/useHLSPlayer';
import LoadingSpinner from './LoadingSpinner';

interface PlayerSectionProps {
  currentChannel: Channel | null;
}

export default function PlayerSection({ currentChannel }: PlayerSectionProps) {
  const {
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
  } = useHLSPlayer();

  // Load stream when currentChannel changes
  useEffect(() => {
    if (currentChannel?.url) {
      loadStream(currentChannel.url);
    }
  }, [currentChannel?.url, loadStream]);

  return (
    <div className="bg-gray-900/95 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/20 to-pink-500/20 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <FaVideo className="text-blue-500" />
          Live Player
        </h2>
        <div className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse">
          LIVE
        </div>
      </div>

      {/* Video Player */}
      <div className="p-6 bg-gray-950 min-h-[500px] flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          controls
          className="w-full max-h-[70vh] rounded-xl shadow-2xl"
          onClick={togglePlay}
        />
        
        {isLoading && (
          <div className="mt-4">
            <LoadingSpinner />
            <p className="text-gray-400 mt-2">Loading stream...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={togglePlay}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={toggleMute}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
          >
            🔇 Mute
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-all"
          >
            ⛶ Fullscreen
          </button>
        </div>
      </div>

      {/* Channel Info */}
      {currentChannel && (
        <div className="p-6 bg-gray-800/30 border-t border-white/10">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
            <FaInfoCircle />
            Channel Information
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="Channel Name" value={currentChannel.title} />
            <InfoItem label="Region" value={currentChannel.region} />
            <InfoItem label="Category" value={currentChannel.category} />
            <InfoItem label="Quality" value={currentChannel.quality} />
            <InfoItem label="Bitrate" value={`${currentBitrate} kbps`} />
            <InfoItem label="Buffer" value={`${bufferStatus}%`} />
            <InfoItem label="Status" value={isPlaying ? 'Live' : 'Paused'} />
            <InfoItem label="Type" value={currentChannel.type.toUpperCase()} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}