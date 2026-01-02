import { TweetList } from '@/components/TweetList';

export default function UnclassifiedPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📥</span>
        <h1 className="text-2xl font-bold">Unclassified</h1>
      </div>

      <p className="text-[#a1a1aa] mb-6">
        These tweets are waiting to be classified by AI or manually assigned to a theme.
      </p>

      <TweetList
        endpoint="/api/tweets?unclassified=true"
        emptyMessage="All tweets are classified!"
      />
    </div>
  );
}
