import { NextRequest } from 'next/server';
import { db, tweets } from '@/db';
import { eq } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';
import { classifyAndUpdateTweet } from '@/lib/classification';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tweets/:id - Détail d'un tweet
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const tweet = await db.query.tweets.findFirst({
      where: eq(tweets.id, id),
      with: {
        theme: true,
      },
    });

    if (!tweet) {
      return errorResponse('Tweet not found', 404);
    }

    return successResponse({ tweet });

  } catch (error) {
    console.error('Error fetching tweet:', error);
    return errorResponse('Failed to fetch tweet', 500);
  }
}

// PATCH /api/tweets/:id - Modifier un tweet (public pour le dashboard)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { themeId, tags, isFavorite, forceClassify } = body;

    const existing = await db.query.tweets.findFirst({
      where: eq(tweets.id, id),
    });

    if (!existing) {
      return errorResponse('Tweet not found', 404);
    }

    const updateData: Partial<typeof tweets.$inferInsert> = {};

    if (themeId !== undefined) {
      updateData.themeId = themeId;
    }

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    if (isFavorite !== undefined) {
      updateData.isFavorite = isFavorite;
    }

    const [updatedTweet] = await db.update(tweets)
      .set(updateData)
      .where(eq(tweets.id, id))
      .returning();

    // Re-classifier si demandé
    if (forceClassify) {
      await db.update(tweets)
        .set({ isClassified: false })
        .where(eq(tweets.id, id));

      classifyAndUpdateTweet(id).catch(err =>
        console.error('Classification error:', err)
      );
    }

    return successResponse({ tweet: updatedTweet });

  } catch (error) {
    console.error('Error updating tweet:', error);
    return errorResponse('Failed to update tweet', 500);
  }
}

// DELETE /api/tweets/:id - Supprimer un tweet (public pour le dashboard)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const existing = await db.query.tweets.findFirst({
      where: eq(tweets.id, id),
    });

    if (!existing) {
      return errorResponse('Tweet not found', 404);
    }

    await db.delete(tweets).where(eq(tweets.id, id));

    return successResponse({ message: 'Tweet deleted' });

  } catch (error) {
    console.error('Error deleting tweet:', error);
    return errorResponse('Failed to delete tweet', 500);
  }
}
