import { NextRequest } from 'next/server';
import { db, tweets } from '@/db';
import { eq, desc, sql, and, notInArray } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

// GET /api/suggestions - Obtenir des suggestions d'inspiration
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const themeId = searchParams.get('themeId');
  const count = Math.min(parseInt(searchParams.get('count') || '5'), 20);
  const excludeIds = searchParams.get('excludeIds')?.split(',').filter(Boolean) || [];

  try {
    const conditions = [];

    if (themeId) {
      conditions.push(eq(tweets.themeId, themeId));
    }

    if (excludeIds.length > 0) {
      conditions.push(notInArray(tweets.id, excludeIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sélection aléatoire avec priorité aux favoris
    const suggestions = await db
      .select()
      .from(tweets)
      .where(whereClause)
      .orderBy(
        desc(tweets.isFavorite),
        sql`RANDOM()`
      )
      .limit(count);

    // Récupérer les thèmes associés
    const suggestionsWithThemes = await Promise.all(
      suggestions.map(async (tweet) => {
        if (tweet.themeId) {
          const theme = await db.query.themes.findFirst({
            where: eq(tweets.themeId, tweet.themeId),
          });
          return { ...tweet, theme };
        }
        return { ...tweet, theme: null };
      })
    );

    return successResponse({ suggestions: suggestionsWithThemes });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return errorResponse('Failed to fetch suggestions', 500);
  }
}
