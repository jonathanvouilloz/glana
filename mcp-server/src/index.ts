#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = process.env.GLANA_API_URL || "https://glana.ai";
const API_KEY = process.env.GLANA_API_KEY || "";

async function apiRequest(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${API_BASE_URL}/api${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const server = new Server(
  {
    name: "glana",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_tweets",
        description:
          "Search through saved tweets in the Glana swipe file. Can filter by theme, tag, search term, favorites only, or unclassified tweets.",
        inputSchema: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Search term to find in tweet content",
            },
            themeId: {
              type: "string",
              description: "Filter by theme ID",
            },
            tag: {
              type: "string",
              description: "Filter by tag",
            },
            favorites: {
              type: "boolean",
              description: "Only return favorite tweets",
            },
            unclassified: {
              type: "boolean",
              description: "Only return unclassified tweets",
            },
            limit: {
              type: "number",
              description: "Maximum number of tweets to return (default: 20, max: 100)",
            },
          },
        },
      },
      {
        name: "get_suggestions",
        description:
          "Get random tweet suggestions for inspiration. Prioritizes favorites. Use this to inspire content creation or find ideas.",
        inputSchema: {
          type: "object",
          properties: {
            themeId: {
              type: "string",
              description: "Filter suggestions by theme ID",
            },
            count: {
              type: "number",
              description: "Number of suggestions to return (default: 5, max: 20)",
            },
          },
        },
      },
      {
        name: "list_themes",
        description:
          "List all themes in the Glana swipe file with their tweet counts.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_stats",
        description:
          "Get statistics about the Glana swipe file: total tweets, themes, unclassified count, tweets per theme, top tags, and last capture date.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_tweets": {
        const params: Record<string, string> = {};
        if (args?.search) params.search = String(args.search);
        if (args?.themeId) params.themeId = String(args.themeId);
        if (args?.tag) params.tag = String(args.tag);
        if (args?.favorites) params.favorites = "true";
        if (args?.unclassified) params.unclassified = "true";
        if (args?.limit) params.limit = String(args.limit);

        const data = await apiRequest("/tweets", params);
        const tweets = data.tweets || [];

        if (tweets.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No tweets found matching your criteria.",
              },
            ],
          };
        }

        const formatted = tweets
          .map((t: any) => {
            const theme = t.theme?.name || "Unclassified";
            const tags = t.tags?.length ? t.tags.join(", ") : "none";
            const fav = t.isFavorite ? " ⭐" : "";
            return `---\n@${t.authorUsername}${fav}\nTheme: ${theme} | Tags: ${tags}\n\n${t.content}\n\nURL: ${t.tweetUrl}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${data.total} tweets (showing ${tweets.length}):\n\n${formatted}`,
            },
          ],
        };
      }

      case "get_suggestions": {
        const params: Record<string, string> = {};
        if (args?.themeId) params.themeId = String(args.themeId);
        if (args?.count) params.count = String(args.count);

        const data = await apiRequest("/suggestions", params);
        const suggestions = data.suggestions || [];

        if (suggestions.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No suggestions available.",
              },
            ],
          };
        }

        const formatted = suggestions
          .map((t: any, i: number) => {
            const theme = t.theme?.name || "Unclassified";
            const fav = t.isFavorite ? " ⭐" : "";
            return `${i + 1}. @${t.authorUsername}${fav} [${theme}]\n${t.content}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Here are ${suggestions.length} tweet suggestions for inspiration:\n\n${formatted}`,
            },
          ],
        };
      }

      case "list_themes": {
        const data = await apiRequest("/themes");
        const themes = data.themes || [];

        if (themes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No themes found.",
              },
            ],
          };
        }

        const formatted = themes
          .map((t: any) => `• ${t.name} (${t.tweetCount} tweets)${t.description ? `: ${t.description}` : ""}`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Themes in Glana:\n\n${formatted}`,
            },
          ],
        };
      }

      case "get_stats": {
        const data = await apiRequest("/stats");

        const themesBreakdown = data.tweetsPerTheme
          ?.map((t: any) => `  • ${t.themeName}: ${t.count}`)
          .join("\n") || "  None";

        const topTags = data.topTags
          ?.map((t: any) => `  • ${t.tag}: ${t.count}`)
          .join("\n") || "  None";

        const text = `Glana Statistics:

Total tweets: ${data.totalTweets}
Total themes: ${data.totalThemes}
Unclassified: ${data.unclassifiedCount}
Last captured: ${data.lastCaptured || "Never"}

Tweets per theme:
${themesBreakdown}

Top tags:
${topTags}`;

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  if (!API_KEY) {
    console.error("Warning: GLANA_API_KEY environment variable not set");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
