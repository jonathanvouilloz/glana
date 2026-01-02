import { NextRequest } from 'next/server';
import { db, tweets, themes } from '@/db';
import { eq, desc, sql } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

// GET /api/stats - Statistiques de la bibliothèque (public pour le dashboard)
export async function GET(request: NextRequest) {
  try {
    // Total tweets
    const [totalTweetsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tweets);

    // Total themes
    const [totalThemesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(themes);

    // Tweets non classifiés
    const [unclassifiedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tweets)
      .where(eq(tweets.isClassified, false));

    // Tweets par thème
    const tweetsPerTheme = await db
      .select({
        themeId: themes.id,
        themeName: themes.name,
        count: sql<number>`count(${tweets.id})::int`,
      })
      .from(themes)
      .leftJoin(tweets, eq(themes.id, tweets.themeId))
      .groupBy(themes.id)
      .orderBy(desc(sql`count(${tweets.id})`));

    // Dernier tweet capturé
    const [lastTweet] = await db
      .select({ capturedAt: tweets.capturedAt })
      .from(tweets)
      .orderBy(desc(tweets.capturedAt))
      .limit(1);

    // Top tags (agrégation depuis jsonb)
    const allTweets = await db.select({ tags: tweets.tags }).from(tweets);
    const tagCounts: Record<string, number> = {};

    allTweets.forEach(tweet => {
      if (tweet.tags && Array.isArray(tweet.tags)) {
        tweet.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return successResponse({
      totalTweets: totalTweetsResult?.count || 0,
      totalThemes: totalThemesResult?.count || 0,
      unclassifiedCount: unclassifiedResult?.count || 0,
      tweetsPerTheme,
      topTags,
      lastCaptured: lastTweet?.capturedAt?.toISOString() || null,
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return errorResponse('Failed to fetch stats', 500);
  }
}
