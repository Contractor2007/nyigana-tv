'use client';

import { 
  FaWifi, 
  FaClock, 
  FaDatabase, 
  FaExpand, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaSignal,
  FaServer
} from 'react-icons/fa';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

interface StatusBarProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  bitrate?: number;
}

export default function StatusBar({ videoRef, bitrate = 0 }: StatusBarProps) {
  const { status, bufferStatus, currentTime } = useConnectionMonitor();

  const getConnectionIcon = () => {
    if (!status.isOnline) return <FaExclamationTriangle className="text-red-500" />;
    if (status.latency && status.latency < 100) return <FaWifi className="text-green-500" />;
    if (status.latency && status.latency < 300) return <FaSignal className="text-yellow-500" />;
    return <FaSignal className="text-orange-500" />;
  };

  const getConnectionText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.latency && status.latency < 100) return 'Excellent';
    if (status.latency && status.latency < 300) return 'Good';
    return 'Fair';
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 mt-8 border border-white/10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <div className="relative">
            {getConnectionIcon()}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              status.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Connection</div>
            <div className="font-medium flex items-center gap-2">
              <span>{getConnectionText()}</span>
              {status.latency && (
                <span className="text-xs text-gray-500">
                  {status.latency}ms
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Time */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <FaClock className="text-blue-400" />
          <div>
            <div className="text-sm text-gray-400">Time</div>
            <div className="font-medium font-mono">{currentTime}</div>
          </div>
        </div>

        {/* Buffer Status */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <FaDatabase className="text-purple-400" />
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Buffer</span>
              <span>{bufferStatus}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${bufferStatus}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bitrate */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
          <FaServer className="text-green-400" />
          <div>
            <div className="text-sm text-gray-400">Bitrate</div>
            <div className="font-medium">
              {bitrate > 0 ? `${bitrate.toLocaleString()} kbps` : '--'}
            </div>
          </div>
        </div>

        {/* Fullscreen Button */}
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
             onClick={toggleFullscreen}>
          <FaExpand className="text-orange-400" />
          <div>
            <div className="text-sm text-gray-400">Display</div>
            <div className="font-medium">Fullscreen</div>
          </div>
        </div>
      </div>

      {/* Detailed Status Row */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-400">Stream:</span>
            <span className="font-medium">Active</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Type:</span>
            <span className="font-medium">{status.connectionType}</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Last Check:</span>
            <span className="font-medium">
              {status.lastChecked?.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) || '--:--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Refresh
          </button>
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm transition-colors"
          >
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}