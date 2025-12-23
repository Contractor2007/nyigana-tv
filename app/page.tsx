'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [channels, setChannels] = useState<any[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');

  const router = useRouter();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'sports', label: 'Sports' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'asia', label: 'Asia' },
    { id: 'usa', label: 'USA' },
  ];

  // Fetch channels from public JSON
  useEffect(() => {
    fetch('/streams.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch channels');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data.channels)) {
          throw new Error('Invalid JSON format: channels array missing');
        }
        setChannels(data.channels);
        setFilteredChannels(data.channels);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filter channels by category
  const filterChannels = (category: string) => {
    if (category === 'all') {
      setFilteredChannels(channels);
    } else {
      setFilteredChannels(
        channels.filter(ch => ch.category?.toLowerCase() === category.toLowerCase())
      );
    }
  };

  // Search channels by title
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = channels.filter(ch =>
      ch.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredChannels(filtered);
  };

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
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Error Loading Channels
          </h2>
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
        <Header stats={{ total: channels.length }} />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 my-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setCurrentFilter(cat.id);
                filterChannels(cat.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                currentFilter === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <FaSearch />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
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

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.isArray(filteredChannels) && filteredChannels.length > 0 ? (
            filteredChannels.map(channel => (
              <div
                key={channel.id}
                className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition"
                onClick={() => router.push(`/${channel.id}`)}
              >
                <h2 className="text-lg font-bold">{channel.title}</h2>
                <p className="text-gray-400">{channel.description}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-12">
              No channels found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
