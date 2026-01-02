import { NextRequest } from 'next/server';
import { db, tweets } from '@/db';
import { eq } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { classifyAndUpdateTweet } from '@/lib/classification';

// POST /api/tweets/from-url - Extraire et sauvegarder un tweet depuis son URL
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { tweetUrl } = body;

    if (!tweetUrl) {
      return errorResponse('Missing required field: tweetUrl');
    }

    // Extraire le tweetId depuis l'URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      return errorResponse('Invalid tweet URL');
    }
    const tweetId = tweetIdMatch[1];

    // Vérifier si le tweet existe déjà
    const existing = await db.query.tweets.findFirst({
      where: eq(tweets.tweetId, tweetId),
    });

    if (existing) {
      return successResponse({ tweet: existing, message: 'Tweet already exists' });
    }

    // Essayer d'extraire via l'API syndication de Twitter
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=0`;

    const response = await fetch(syndicationUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Glana/1.0)',
      },
    });

    if (!response.ok) {
      return errorResponse('Failed to fetch tweet from Twitter. Try using the extension instead.', 422);
    }

    const tweetData = await response.json();

    if (!tweetData.text) {
      return errorResponse('Could not extract tweet content', 422);
    }

    // Extraire les données
    const content = tweetData.text;
    const authorUsername = tweetData.user?.screen_name || 'unknown';
    const authorDisplayName = tweetData.user?.name || null;

    // Insérer le nouveau tweet
    const [newTweet] = await db.insert(tweets).values({
      tweetId,
      tweetUrl,
      content,
      authorUsername,
      authorDisplayName,
      isClassified: false,
      isFavorite: false,
      tags: [],
    }).returning();

    // Déclencher la classification async
    classifyAndUpdateTweet(newTweet.id).catch(err =>
      console.error('Classification error:', err)
    );

    return successResponse({ tweet: newTweet }, 201);

  } catch (error) {
    console.error('Error creating tweet from URL:', error);
    return errorResponse('Failed to create tweet from URL', 500);
  }
}
