import { NextRequest } from 'next/server';
import { db, themes, tweets } from '@/db';
import { eq, sql } from 'drizzle-orm';
import { errorResponse, successResponse, optionsResponse } from '@/lib/auth';

export async function OPTIONS() {
  return optionsResponse();
}

// GET /api/themes - Liste tous les thèmes (public pour le dashboard)
export async function GET(request: NextRequest) {
  try {
    // Récupérer les thèmes avec le compte de tweets
    const themesWithCount = await db
      .select({
        id: themes.id,
        name: themes.name,
        description: themes.description,
        color: themes.color,
        suggestedTags: themes.suggestedTags,
        createdAt: themes.createdAt,
        tweetCount: sql<number>`count(${tweets.id})::int`,
      })
      .from(themes)
      .leftJoin(tweets, eq(themes.id, tweets.themeId))
      .groupBy(themes.id)
      .orderBy(themes.name);

    return successResponse({ themes: themesWithCount });

  } catch (error) {
    console.error('Error fetching themes:', error);
    return errorResponse('Failed to fetch themes', 500);
  }
}

// POST /api/themes - Créer un nouveau thème (public pour le dashboard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, suggestedTags } = body;

    if (!name) {
      return errorResponse('Missing required field: name');
    }

    // Vérifier si le thème existe déjà
    const existing = await db.query.themes.findFirst({
      where: eq(themes.name, name),
    });

    if (existing) {
      return errorResponse('Theme already exists', 409);
    }

    const [newTheme] = await db.insert(themes).values({
      name,
      description: description || null,
      color: color || '#6366f1',
      suggestedTags: suggestedTags || [],
    }).returning();

    return successResponse({ theme: newTheme }, 201);

  } catch (error) {
    console.error('Error creating theme:', error);
    return errorResponse('Failed to create theme', 500);
  }
}
