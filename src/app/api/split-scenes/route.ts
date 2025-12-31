/**
 * Scene Splitting API Route
 *
 * Splits a story into individual scenes for short-form content production.
 * Uses direct OpenRouter calls (migrated from yumeta.kr proxy).
 *
 * Model: x-ai/grok-4-fast
 */

import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouter,
  getOpenRouterKey,
  OpenRouterAPIError,
} from "@/lib/llm/openrouter";
import {
  buildSplitSceneRequest,
  parseSplitSceneResponse,
} from "@/lib/prompts";
import { parseSplitSceneContent } from "@/lib/core/parseScript";
import { calculateCost } from "@/lib/llm/pricing";
import type { Phrase } from "@/lib/core/types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Route Handler
 * ───────────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { story } = body;

    /* Validate required fields */
    if (!story || typeof story !== "string" || story.trim().length === 0) {
      return NextResponse.json(
        { error: "story is required and must be a non-empty string" },
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

    /* Build and send request */
    const requestParams = buildSplitSceneRequest({ story: story.trim() });

    const result = await callOpenRouter(apiKey, requestParams);

    /* Parse response using the prompt module parser */
    const parsedScenes = parseSplitSceneResponse(result.content);

    /* Log raw API response for debugging */
    console.log("=== OpenRouter direct response ===");
    console.log("Content length:", parsedScenes.rawContent.length);
    console.log("Scene count:", parsedScenes.scenes.length);
    console.log("================================");

    /*
     * Use the existing parseScript parser for backwards compatibility.
     * This converts the raw scene content into Phrase/Statement structure.
     */
    const phrases: Phrase[] = parseSplitSceneContent(parsedScenes.rawContent);

    console.log("Parsed phrases count:", phrases.length);
    console.log("Total statements:", phrases.reduce((sum, p) => sum + p.statements.length, 0));

    /* Build normalized usage object consistent with other API routes */
    const inputTokens = result.usage.inputTokens;
    const outputTokens = result.usage.outputTokens;
    const model = result.model;
    const latencyMs = Date.now() - startTime;

    const usage = {
      model,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      cost: calculateCost(model, inputTokens, outputTokens),
      latencyMs,
    };

    return NextResponse.json({
      phrases,
      raw: parsedScenes.rawContent,
      usage,
    });
  } catch (error) {
    console.error("[split-scenes] Error:", error);

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
