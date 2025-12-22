'use client';

import { useState, useMemo } from 'react';
import { FaFilter, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Channel } from '@/types/channel';
import ChannelCard from './ChannelCard';
import { InlineLoadingSpinner } from './LoadingSpinner';

interface ChannelGridProps {
  channels: Channel[];
  currentChannel: Channel | null;
  loading?: boolean;
  error?: string | null;
  onSelectChannel: (channel: Channel) => void;
  onSearch?: (term: string) => void;
  onFilter?: (filter: string) => void;
}

type SortField = 'title' | 'region' | 'quality' | 'category';
type SortDirection = 'asc' | 'desc';

export default function ChannelGrid({ 
  channels, 
  currentChannel, 
  loading = false,
  error = null,
  onSelectChannel,
  onSearch,
  onFilter
}: ChannelGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const categories = [
    { id: 'all', label: 'All', count: channels.length },
    { id: 'sports', label: 'Sports', count: channels.filter(c => c.category === 'sports').length },
    { id: 'entertainment', label: 'Entertainment', count: channels.filter(c => c.category === 'entertainment').length },
    { id: 'asia', label: 'Asia', count: channels.filter(c => 
      ['Mongolia', 'Philippines', 'Turkey', 'UAE', 'Kuwait'].includes(c.region)).length 
    },
    { id: 'usa', label: 'USA', count: channels.filter(c => c.region === 'USA').length },
    { id: 'test', label: 'Test', count: channels.filter(c => c.isTest).length },
  ];

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    // Apply category filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'asia') {
        filtered = filtered.filter(channel => 
          ['Mongolia', 'Philippines', 'Turkey', 'UAE', 'Kuwait'].includes(channel.region)
        );
      } else if (activeFilter === 'usa') {
        filtered = filtered.filter(channel => channel.region === 'USA');
      } else if (activeFilter === 'test') {
        filtered = filtered.filter(channel => channel.isTest);
      } else {
        filtered = filtered.filter(channel => channel.category === activeFilter);
      }
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(channel =>
        channel.title.toLowerCase().includes(term) ||
        channel.description.toLowerCase().includes(term) ||
        channel.region.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Special handling for quality (HD > SD)
      if (sortField === 'quality') {
        const qualityOrder = { '4K': 4, 'HD': 3, 'SD': 2, 'Custom': 1 };
        aValue = qualityOrder[a.quality as keyof typeof qualityOrder] || 0;
        bValue = qualityOrder[b.quality as keyof typeof qualityOrder] || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [channels, activeFilter, searchTerm, sortField, sortDirection]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  const handleFilter = (filterId: string) => {
    setActiveFilter(filterId);
    onFilter?.(filterId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="text-gray-500" />;
    return sortDirection === 'asc' 
      ? <FaSortUp className="text-blue-500" /> 
      : <FaSortDown className="text-blue-500" />;
  };

  if (error) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
        <h3 className="text-lg font-bold text-red-400 mb-2">Error Loading Channels</h3>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <InlineLoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500/20 to-pink-500/20 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <FaFilter className="text-blue-500" />
            Channels ({filteredChannels.length})
          </h2>
          <div className="text-sm text-gray-400">
            Showing {filteredChannels.length} of {channels.length}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="p-4 border-b border-white/10 space-y-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleFilter(category.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeFilter === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span>{category.label}</span>
              <span className="text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <FaSearch />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => handleSort(sortField)}
              className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              {getSortIcon(sortField)}
              <span className="text-sm">Sort</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 hidden group-hover:block">
              <div className="py-1">
                {(['title', 'region', 'quality', 'category'] as SortField[]).map(field => (
                  <button
                    key={field}
                    onClick={() => handleSort(field)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between"
                  >
                    <span className="capitalize">{field}</span>
                    {getSortIcon(field)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No channels found</div>
            <p className="text-gray-400 text-sm mb-6">
              {searchTerm ? 'Try a different search term' : 'Try changing the filter'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredChannels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isActive={currentChannel?.id === channel.id}
                onClick={() => onSelectChannel(channel)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-white/10 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Active</div>
            <div className="font-bold text-green-500">● Live</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Quality</div>
            <div className="font-medium">
              {filteredChannels.filter(c => c.quality === 'HD').length} HD
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Regions</div>
            <div className="font-medium">
              {new Set(filteredChannels.map(c => c.region)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}