'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/dashboard');
    }
  }, [query, router]);

  return (
    <form onSubmit={handleSearch} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tweets..."
        className="w-full px-4 py-2 pl-10 bg-[#141414] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] focus:outline-none focus:border-[#A300D9] transition-colors"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b]">
        🔍
      </span>
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            router.push('/dashboard');
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-white"
        >
          ✕
        </button>
      )}
    </form>
  );
}
