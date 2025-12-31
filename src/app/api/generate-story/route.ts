/* API Route: Generate Story from Keywords */

import { NextRequest, NextResponse } from "next/server";
import { generateStory } from "@/lib/gemini/generateStory";
import type { SelectedKeywords } from "@/lib/core/types";

/*
 * POST /api/generate-story
 *
 * Generates a Korean "sseol" (story) using OpenRouter with Claude Sonnet 4.5.
 *
 * Request body:
 * - keywords: SelectedKeywords object (full configuration)
 *
 * Response:
 * - story: string (generated story text)
 * - usage: object (token usage and cost metadata for client-side logging)
 *
 * This API follows the same interface as yt-shorts-generator-3,
 * requiring the full SelectedKeywords object for story generation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    /* Validate keywords object */
    if (!body.keywords) {
      return NextResponse.json(
        { error: "keywords object is required" },
        { status: 400 }
      );
    }

    const keywords = body.keywords as SelectedKeywords;

    if (!keywords.topic) {
      return NextResponse.json(
        { error: "keywords.topic is required" },
        { status: 400 }
      );
    }

    const result = await generateStory(keywords, apiKey);

    return NextResponse.json({
      story: result.story,
      usage: result.usage,
    });
  } catch (error) {
    console.error("generate-story API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
