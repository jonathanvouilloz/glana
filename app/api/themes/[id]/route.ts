import { NextRequest } from 'next/server';
import { db, themes, tweets } from '@/db';
import { eq } from 'drizzle-orm';
import { validateApiKey, unauthorizedResponse, errorResponse, successResponse } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/themes/:id - Modifier un thème
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, description, color } = body;

    const existing = await db.query.themes.findFirst({
      where: eq(themes.id, id),
    });

    if (!existing) {
      return errorResponse('Theme not found', 404);
    }

    const updateData: Partial<typeof themes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    const [updatedTheme] = await db.update(themes)
      .set(updateData)
      .where(eq(themes.id, id))
      .returning();

    return successResponse({ theme: updatedTheme });

  } catch (error) {
    console.error('Error updating theme:', error);
    return errorResponse('Failed to update theme', 500);
  }
}

// DELETE /api/themes/:id - Supprimer un thème
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;

  try {
    const existing = await db.query.themes.findFirst({
      where: eq(themes.id, id),
    });

    if (!existing) {
      return errorResponse('Theme not found', 404);
    }

    // Mettre les tweets associés à themeId: null
    await db.update(tweets)
      .set({ themeId: null })
      .where(eq(tweets.themeId, id));

    // Supprimer le thème
    await db.delete(themes).where(eq(themes.id, id));

    return successResponse({ message: 'Theme deleted' });

  } catch (error) {
    console.error('Error deleting theme:', error);
    return errorResponse('Failed to delete theme', 500);
  }
}
