'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

interface TweetListProps {
  endpoint: string;
  emptyMessage?: string;
}

export function TweetList({ endpoint, emptyMessage = 'No tweets found' }: TweetListProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchTweets = useCallback(async (offset = 0) => {
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}limit=20&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success === false) {
        throw new Error(data.error);
      }

      return {
        tweets: data.tweets || [],
        hasMore: data.hasMore || false,
      };
    } catch (err) {
      throw err;
    }
  }, [endpoint]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setTweets([]);
    setHasMore(true);
    setError(null);

    fetchTweets(0)
      .then(({ tweets, hasMore }) => {
        setTweets(tweets);
        setHasMore(hasMore);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [fetchTweets]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          fetchTweets(tweets.length)
            .then(({ tweets: newTweets, hasMore: more }) => {
              setTweets(prev => [...prev, ...newTweets]);
              setHasMore(more);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [tweets.length, hasMore, loading, loadingMore, fetchTweets]);

  const handleDelete = (id: string) => {
    setTweets(prev => prev.filter(t => t.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#A300D9] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#27272a] rounded-lg hover:bg-[#3f3f46] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="text-center py-20 text-[#a1a1aa]">
        <p className="text-4xl mb-4">📭</p>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tweets.map(tweet => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          onDelete={handleDelete}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-10" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-[#A300D9] border-t-transparent rounded-full" />
        </div>
      )}

      {!hasMore && tweets.length > 0 && (
        <p className="text-center text-[#52525b] py-4">
          No more tweets
        </p>
      )}
    </div>
  );
}
