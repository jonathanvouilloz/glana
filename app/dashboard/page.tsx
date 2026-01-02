'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TweetList } from '@/components/TweetList';
import { SearchBar } from '@/components/SearchBar';
import { SuggestionPanel } from '@/components/SuggestionPanel';

function DashboardContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  const endpoint = search
    ? `/api/tweets?search=${encodeURIComponent(search)}`
    : '/api/tweets';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {search ? `Search: "${search}"` : 'All Tweets'}
        </h1>
      </div>

      <div className="mb-6">
        <SearchBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tweet list */}
        <div className="lg:col-span-2">
          <TweetList
            endpoint={endpoint}
            emptyMessage={search ? 'No tweets match your search' : 'No tweets yet. Start saving tweets!'}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SuggestionPanel />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#A300D9] border-t-transparent rounded-full" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
