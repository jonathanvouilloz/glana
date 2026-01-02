import { pgTable, text, timestamp, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const themes = pgTable('themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color').default('#6366f1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const themesRelations = relations(themes, ({ many }) => ({
  tweets: many(tweets),
}));

export const tweets = pgTable('tweets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tweetId: text('tweet_id').notNull().unique(),
  tweetUrl: text('tweet_url').notNull(),
  authorUsername: text('author_username').notNull(),
  authorDisplayName: text('author_display_name'),
  content: text('content').notNull(),
  themeId: uuid('theme_id').references(() => themes.id),
  tags: jsonb('tags').$type<string[]>().default([]),
  aiAnalysis: jsonb('ai_analysis').$type<{
    suggestedTheme: string;
    suggestedTags: string[];
    hookType: string | null;
    tone: string | null;
    summary: string;
  }>(),
  isClassified: boolean('is_classified').default(false),
  isFavorite: boolean('is_favorite').default(false),
  capturedAt: timestamp('captured_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tweetsRelations = relations(tweets, ({ one }) => ({
  theme: one(themes, {
    fields: [tweets.themeId],
    references: [themes.id],
  }),
}));

// Types inférés pour TypeScript
export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
export type Tweet = typeof tweets.$inferSelect;
export type NewTweet = typeof tweets.$inferInsert;
