'use client';

import { FaIcon } from 'react-icons/fa';
import { Channel } from '@/types/channel';
import * as Icons from 'react-icons/fa';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

export default function ChannelCard({ channel, isActive, onClick }: ChannelCardProps) {
  const IconComponent = Icons[`Fa${channel.icon.charAt(0).toUpperCase() + channel.icon.slice(1)}` as keyof typeof Icons] || Icons.FaTv;
  
  return (
    <div
      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
        isActive
          ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/10 rounded-lg">
          <IconComponent className="text-2xl text-blue-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1 truncate">{channel.title}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {channel.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{channel.region}</span>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                {channel.quality}
              </span>
              {channel.region === 'USA' && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  USA
                </span>
              )}
              {channel.isTest && (
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                  TEST
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}