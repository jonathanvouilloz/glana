import Anthropic from '@anthropic-ai/sdk';
import { db, tweets, themes } from '@/db';
import { eq } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const CLASSIFICATION_PROMPT = `Tu es un assistant qui analyse des tweets pour une bibliothèque de "swipe file" (collection d'inspirations pour créateur de contenu).

THÈMES DISPONIBLES:
{themes}

TWEET À ANALYSER:
"{content}"

Analyse ce tweet et retourne un JSON avec:
1. suggestedTheme: Le nom du thème le plus approprié parmi ceux disponibles, OU un nouveau thème suggéré si aucun ne correspond (max 3 mots)
2. suggestedTags: 2-5 tags descriptifs (en français, lowercase, sans #)
3. hookType: Le type d'accroche utilisé parmi: "question", "statement", "story", "statistic", "controversial", "how-to", "list", "personal", "other"
4. tone: Le ton général parmi: "inspirational", "educational", "humorous", "controversial", "personal", "professional", "provocative"
5. summary: Résumé en 1 phrase de pourquoi ce tweet est inspirant/utile

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`;

export interface ClassificationResult {
  suggestedTheme: string;
  suggestedTags: string[];
  hookType: string | null;
  tone: string | null;
  summary: string;
}

export async function classifyTweet(content: string, existingThemes: string[]): Promise<ClassificationResult> {
  const themesText = existingThemes.length > 0
    ? existingThemes.join(', ')
    : 'Aucun thème existant - suggère-en un nouveau';

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: CLASSIFICATION_PROMPT
        .replace('{themes}', themesText)
        .replace('{content}', content)
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}

export async function classifyAndUpdateTweet(tweetId: string) {
  const tweet = await db.query.tweets.findFirst({
    where: eq(tweets.id, tweetId)
  });

  if (!tweet || tweet.isClassified) return;

  const existingThemes = await db.query.themes.findMany();
  const themeNames = existingThemes.map(t => t.name);

  try {
    const analysis = await classifyTweet(tweet.content, themeNames);

    // Trouver ou créer le thème
    let themeId: string | null = null;
    const matchingTheme = existingThemes.find(
      t => t.name.toLowerCase() === analysis.suggestedTheme.toLowerCase()
    );

    if (matchingTheme) {
      themeId = matchingTheme.id;
    } else if (analysis.suggestedTheme) {
      const [newTheme] = await db.insert(themes).values({
        name: analysis.suggestedTheme,
        description: `Thème auto-créé: ${analysis.summary}`,
      }).returning();
      themeId = newTheme.id;
    }

    // Mettre à jour le tweet
    await db.update(tweets)
      .set({
        themeId,
        tags: analysis.suggestedTags,
        aiAnalysis: analysis,
        isClassified: true,
      })
      .where(eq(tweets.id, tweetId));

  } catch (error) {
    console.error('Classification error:', error);
  }
}
