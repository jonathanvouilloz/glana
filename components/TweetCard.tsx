'use client';

import { useState } from 'react';
import ConfirmModal from './ConfirmModal';

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

interface TweetCardProps {
  tweet: Tweet;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
  onDelete?: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export function TweetCard({ tweet, onFavoriteToggle, onDelete, onTagClick }: TweetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(tweet.isFavorite);

  const handleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    try {
      await fetch(`/api/tweets/${tweet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: newValue }),
      });
      onFavoriteToggle?.(tweet.id, newValue);
    } catch (error) {
      setIsFavorite(!newValue); // Rollback
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tweets/${tweet.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete?.(tweet.id);
      } else {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      console.error('Error deleting tweet:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isDeleting) return null;

  return (
    <div className="tweet-card group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <a
          href={`https://x.com/${tweet.authorUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-[#A300D9] transition-colors"
        >
          <span className="font-medium">@{tweet.authorUsername}</span>
          {tweet.authorDisplayName && (
            <span className="text-[#a1a1aa] text-sm">{tweet.authorDisplayName}</span>
          )}
        </a>
        <span className="text-xs text-[#52525b]">{formatDate(tweet.capturedAt)}</span>
      </div>

      {/* Content */}
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap mb-4">
        {tweet.content}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tweet.theme && (
          <span
            className="theme-badge"
            style={{
              backgroundColor: `${tweet.theme.color}20`,
              color: tweet.theme.color,
              border: `1px solid ${tweet.theme.color}40`,
            }}
          >
            {tweet.theme.name}
          </span>
        )}

        {tweet.tags?.map(tag => (
          <button
            key={tag}
            onClick={() => onTagClick?.(tag)}
            className="tag"
          >
            {tag}
          </button>
        ))}

        {tweet.aiAnalysis?.hookType && (
          <span className="text-xs px-2 py-1 bg-[#1a1a1a] rounded text-[#a1a1aa]">
            {tweet.aiAnalysis.hookType}
          </span>
        )}

        {tweet.aiAnalysis?.tone && (
          <span className="text-xs px-2 py-1 bg-[#1a1a1a] rounded text-[#a1a1aa]">
            {tweet.aiAnalysis.tone}
          </span>
        )}
      </div>

      {/* AI Summary */}
      {tweet.aiAnalysis?.summary && (
        <p className="text-sm text-[#a1a1aa] italic mb-4 border-l-2 border-[#27272a] pl-3">
          {tweet.aiAnalysis.summary}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite
                ? 'text-yellow-500 bg-yellow-500/10'
                : 'text-[#a1a1aa] hover:bg-[#27272a]'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '★' : '☆'}
          </button>

          <a
            href={tweet.tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#A300D9] transition-colors"
            title="View on X"
          >
            ↗
          </a>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 rounded-lg text-[#a1a1aa] hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete tweet"
        >
          🗑
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer ce tweet ?"
        message={`Le tweet de @${tweet.authorUsername} sera définitivement supprimé de ta collection.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
