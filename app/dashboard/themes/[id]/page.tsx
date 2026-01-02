'use client';

import { useEffect, useState, use } from 'react';
import { TweetList } from '@/components/TweetList';

interface Theme {
  id: string;
  name: string;
  description: string | null;
  color: string;
  tweetCount: number;
}

export default function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        const found = data.themes?.find((t: Theme) => t.id === id);
        setTheme(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#A300D9] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#a1a1aa]">Theme not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: theme.color }}
        />
        <h1 className="text-2xl font-bold">{theme.name}</h1>
        <span className="text-[#a1a1aa] text-sm">
          {theme.tweetCount} tweets
        </span>
      </div>

      {theme.description && (
        <p className="text-[#a1a1aa] mb-6">{theme.description}</p>
      )}

      <TweetList
        endpoint={`/api/tweets?themeId=${id}`}
        emptyMessage="No tweets in this theme yet"
      />
    </div>
  );
}
