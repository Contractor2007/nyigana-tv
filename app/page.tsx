'use client';

import { useState, useEffect } from 'react';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import { useStreams } from '@/hooks/useStreams';
import Header from '@/components/Header';
import PlayerSection from '@/components/PlayerSection';
import ChannelCard from '@/components/ChannelCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const {
    filteredChannels,
    loading,
    error,
    currentFilter,
    searchTerm,
    stats,
    filterChannels,
    handleSearch,
    setCurrentFilter,
  } = useStreams();

  const [currentChannel, setCurrentChannel] = useState(
    filteredChannels[0] || null
  );

  // Update current channel when filtered channels change
  useEffect(() => {
    if (!currentChannel && filteredChannels.length > 0) {
      setCurrentChannel(filteredChannels[0]);
    }
  }, [filteredChannels, currentChannel]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'sports', label: 'Sports' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'asia', label: 'Asia' },
    { id: 'usa', label: 'USA' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Channels</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Player - Takes 2/3 width */}
          <div className="lg:col-span-2">
            <PlayerSection currentChannel={currentChannel} />
          </div>

          {/* Channels List - Takes 1/3 width */}
          <div className="bg-gray-900/95 rounded-2xl border border-white/10 shadow-2xl">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500/20 to-pink-500/20 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <FaFilter className="text-blue-500" />
                Channels ({filteredChannels.length})
              </h2>
            </div>

            {/* Category Filter */}
            <div className="p-4 border-b border-white/10">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setCurrentFilter(category.id);
                      filterChannels(category.id);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      currentFilter === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <FaSearch />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search channels..."
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Channels Grid */}
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredChannels.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No channels found matching your criteria
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChannels.map(channel => (
                    <ChannelCard
                      key={channel.id}
                      channel={channel}
                      isActive={currentChannel?.id === channel.id}
                      onClick={() => setCurrentChannel(channel)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}