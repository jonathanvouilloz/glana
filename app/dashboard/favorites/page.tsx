import { TweetList } from '@/components/TweetList';

export default function FavoritesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⭐</span>
        <h1 className="text-2xl font-bold">Favorites</h1>
      </div>

      <TweetList
        endpoint="/api/tweets?favorites=true"
        emptyMessage="No favorite tweets yet. Star some tweets to see them here!"
      />
    </div>
  );
}
