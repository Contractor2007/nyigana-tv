'use client';

import { useState, useEffect, useCallback } from 'react';
import { Channel, ChannelStats } from '@/types/channel';

export function useStreams() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch channels from JSON
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/channels.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.channels || !Array.isArray(data.channels)) {
        throw new Error('Invalid channels data format');
      }
      
      setChannels(data.channels);
      setFilteredChannels(data.channels);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load channels');
      
      // Fallback to hardcoded channels if JSON fails
      const fallbackChannels = [
        {
          id: 1,
          title: "Fallback Channel",
          description: "Emergency fallback stream",
          url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
          type: "hls",
          quality: "HD",
          region: "Test",
          category: "test",
          icon: "warning",
          active: true,
          isTest: true
        }
      ];
      setChannels(fallbackChannels);
      setFilteredChannels(fallbackChannels);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and search channels
  const filterChannels = useCallback((category: string) => {
    setCurrentFilter(category);
    
    let filtered = channels;
    
    if (category !== 'all') {
      if (category === 'asia') {
        filtered = channels.filter(channel => 
          ['Mongolia', 'Philippines', 'Turkey', 'UAE', 'Kuwait'].includes(channel.region)
        );
      } else if (category === 'usa') {
        filtered = channels.filter(channel => channel.region === 'USA');
      } else {
        filtered = channels.filter(channel => channel.category === category);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(channel =>
        channel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredChannels(filtered);
  }, [channels, searchTerm]);

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    filterChannels(currentFilter);
  }, [currentFilter, filterChannels]);

  // Calculate stats
  const calculateStats = useCallback((): ChannelStats => {
    const total = channels.length;
    const sports = channels.filter(c => c.category === 'sports').length;
    const regions = new Set(channels.map(c => c.region)).size;
    const online = channels.filter(c => c.active).length;
    
    return { total, sports, regions, online };
  }, [channels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    filterChannels(currentFilter);
  }, [currentFilter, filterChannels]);

  return {
    channels,
    filteredChannels,
    loading,
    error,
    currentFilter,
    searchTerm,
    stats: calculateStats(),
    fetchChannels,
    filterChannels,
    handleSearch,
    setCurrentFilter,
  };
}