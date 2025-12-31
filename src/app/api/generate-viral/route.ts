/**
 * Viral Content Generation API Route
 *
 * Generates SNS-optimized descriptions and hashtags for story content.
 * Uses direct OpenRouter calls (migrated from yumeta.kr proxy).
 *
 * Model: openai/gpt-4o
 */

import { NextResponse } from "next/server";
import {
  callOpenRouter,
  getOpenRouterKey,
  OpenRouterAPIError,
} from "@/lib/llm/openrouter";
import {
  buildGenerateViralRequest,
  parseViralResponse,
} from "@/lib/prompts";

/* ─────────────────────────────────────────────────────────────────────────────
 * API Types (backwards compatible)
 * ───────────────────────────────────────────────────────────────────────────── */

export interface GenerateViralAPIRequest {
  storyContent: string;
}

export interface GenerateViralAPIResponse {
  success: boolean;
  description: string;
  hashtags: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Route Handler
 * ───────────────────────────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body: GenerateViralAPIRequest = await request.json();

    /* Validate required fields */
    if (!body.storyContent) {
      return NextResponse.json(
        { error: "storyContent is required" },
        { status: 400 }
      );
    }

    /* Get API key */
    let apiKey: string;
    try {
      apiKey = getOpenRouterKey();
    } catch {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[generate-viral] Generating viral content for story length:", body.storyContent.length);

    /* Build and send request */
    const requestParams = buildGenerateViralRequest({
      storyContent: body.storyContent,
    });

    const result = await callOpenRouter(apiKey, requestParams);

    /* Parse response */
    const parsed = parseViralResponse(result.content);

    console.log("[generate-viral] Generated description length:", parsed.description.length);
    console.log("[generate-viral] Generated hashtags:", parsed.hashtags.split(" ").filter(Boolean).length, "tags");

    const response: GenerateViralAPIResponse = {
      success: true,
      description: parsed.description,
      hashtags: parsed.hashtags,
      model: result.model,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[generate-viral] Error:", error);

    if (error instanceof OpenRouterAPIError) {
      return NextResponse.json(
        {
          error: "OpenRouter API error",
          details: error.message,
          code: error.errorCode,
        },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate viral content", details: message },
      { status: 500 }
    );
  }
}
