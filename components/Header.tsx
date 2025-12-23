'use client';

import { FaTv, FaBroadcastTower, FaGlobe, FaFutbol } from 'react-icons/fa';
import { ChannelStats } from '@/types/channel';

interface HeaderProps {
  stats: ChannelStats;
}

export default function Header({ stats }: HeaderProps) {
  return (
    <div className="bg-gray-900/90 backdrop-blur-md rounded-3xl p-6 mb-8 border border-white/10 shadow-2xl">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          <FaTv className="text-white" />
          Nyigana TV
        </h1>
        <p className="mt-2 md:mt-0 text-gray-400 text-lg">
          Your hub for sports, entertainment & international channels
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatItem 
          icon={<FaBroadcastTower className="text-blue-500 text-2xl" />}
          value={stats.total}
          label="Total Channels"
        />
        <StatItem 
          icon={<FaFutbol className="text-green-500 text-2xl" />}
          value={stats.sports}
          label="Sports Channels"
        />
        <StatItem 
          icon={<FaGlobe className="text-yellow-500 text-2xl" />}
          value={stats.regions}
          label="Countries"
        />
        <StatItem 
          icon={<FaTv className="text-purple-500 text-2xl" />}
          value={`${stats.online} Online`}
          label="Current Status"
        />
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
      {icon}
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </div>
  );
}
