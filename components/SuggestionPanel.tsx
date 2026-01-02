'use client';

import { useState, useEffect } from 'react';
import { TweetCard } from './TweetCard';

interface Tweet {
  id: string;
  content: string;
  authorUsername: string;
  authorDisplayName: string | null;
  tweetUrl: string;
  theme: { id: string; name: string; color: string } | null;
  tags: string[];
  isFavorite: boolean;
  aiAnalysis: {
    hookType: string | null;
    tone: string | null;
    summary: string;
  } | null;
  capturedAt: string;
}

interface Theme {
  id: string;
  name: string;
}

export function SuggestionPanel() {
  const [suggestions, setSuggestions] = useState<Tweet[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        if (data.themes) setThemes(data.themes);
      })
      .catch(console.error);
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ count: '3' });
      if (selectedTheme) params.set('themeId', selectedTheme);
      if (excludeIds.length > 0) params.set('excludeIds', excludeIds.join(','));

      const res = await fetch(`/api/suggestions?${params}`);
      const data = await res.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setExcludeIds(prev => [...prev, ...data.suggestions.map((s: Tweet) => s.id)]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-[#27272a] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>🎲</span>
          Inspire me
        </h2>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={selectedTheme}
          onChange={(e) => {
            setSelectedTheme(e.target.value);
            setExcludeIds([]);
          }}
          className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-white focus:outline-none focus:border-[#A300D9]"
        >
          <option value="">All themes</option>
          {themes.map(theme => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>

        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-[#A300D9] text-white rounded-lg font-medium hover:bg-[#8a00b8] transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Shuffle'}
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-[#a1a1aa]">
          <p className="text-3xl mb-2">✨</p>
          <p>Click "Shuffle" to get random inspiration</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map(tweet => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      )}
    </div>
  );
}
