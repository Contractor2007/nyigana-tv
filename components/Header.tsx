'use client';

import { FaSatelliteDish } from 'react-icons/fa';
import { ChannelStats } from '@/types/channel';

interface HeaderProps {
  stats: ChannelStats;
}

export default function Header({ stats }: HeaderProps) {
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10 shadow-2xl">
      <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center gap-4">
        <FaSatelliteDish className="text-blue-500" />
        <span className="bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
          StreamMaster Pro
        </span>
      </h1>
      <p className="text-gray-400 text-lg mb-6">
        Your complete collection of sports, entertainment, and international TV channels
      </p>
      
      <div className="flex flex-wrap gap-6">
        <StatItem 
          icon={<FaSatelliteDish className="text-blue-500 text-xl" />}
          value={stats.total}
          label="Total Channels"
        />
        <StatItem 
          icon={<FaSatelliteDish className="text-green-500 text-xl" />}
          value={stats.sports}
          label="Sports Channels"
        />
        <StatItem 
          icon={<FaSatelliteDish className="text-yellow-500 text-xl" />}
          value={stats.regions}
          label="Countries"
        />
        <StatItem 
          icon={<FaSatelliteDish className="text-purple-500 text-xl" />}
          value={`${stats.online} Online`}
          label="Current Status"
        />
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
      {icon}
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  );
}