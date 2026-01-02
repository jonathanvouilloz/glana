import { NextRequest } from 'next/server';
import { db, tweets, themes } from '@/db';
import { eq, desc, ilike, and, isNull, sql } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse, optionsResponse } from '@/lib/auth';
import { classifyAndUpdateTweet } from '@/lib/classification';

export async function OPTIONS() {
  return optionsResponse();
}

// GET /api/tweets - Liste les tweets avec filtres (public pour le dashboard)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const themeId = searchParams.get('themeId');
  const tag = searchParams.get('tag');
  const search = searchParams.get('search');
  const favorites = searchParams.get('favorites') === 'true';
  const unclassified = searchParams.get('unclassified') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const conditions = [];

    if (themeId) {
      conditions.push(eq(tweets.themeId, themeId));
    }

    if (favorites) {
      conditions.push(eq(tweets.isFavorite, true));
    }

    if (unclassified) {
      conditions.push(eq(tweets.isClassified, false));
    }

    if (search) {
      conditions.push(ilike(tweets.content, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [tweetsList, countResult] = await Promise.all([
      db.query.tweets.findMany({
        where: whereClause,
        with: {
          theme: true,
        },
        orderBy: [desc(tweets.capturedAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(tweets)
        .where(whereClause),
    ]);

    // Filtrer par tag si nécessaire (post-query car jsonb)
    let filteredTweets = tweetsList;
    if (tag) {
      filteredTweets = tweetsList.filter(t =>
        t.tags && Array.isArray(t.tags) && t.tags.includes(tag)
      );
    }

    const total = Number(countResult[0]?.count || 0);

    return successResponse({
      tweets: filteredTweets,
      total,
      hasMore: offset + limit < total,
    });

  } catch (error) {
    console.error('Error fetching tweets:', error);
    return errorResponse('Failed to fetch tweets', 500);
  }
}

// POST /api/tweets - Ajouter un nouveau tweet
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { tweetUrl, content, authorUsername, authorDisplayName } = body;

    if (!tweetUrl || !content || !authorUsername) {
      return errorResponse('Missing required fields: tweetUrl, content, authorUsername');
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

    // Insérer le nouveau tweet
    const [newTweet] = await db.insert(tweets).values({
      tweetId,
      tweetUrl,
      content,
      authorUsername,
      authorDisplayName: authorDisplayName || null,
      isClassified: false,
      isFavorite: false,
      tags: [],
    }).returning();

    // Déclencher la classification async (non-bloquant)
    classifyAndUpdateTweet(newTweet.id).catch(err =>
      console.error('Classification error:', err)
    );

    return successResponse({ tweet: newTweet }, 201);

  } catch (error) {
    console.error('Error creating tweet:', error);
    return errorResponse('Failed to create tweet', 500);
  }
}
