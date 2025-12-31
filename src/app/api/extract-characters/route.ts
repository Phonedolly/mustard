/**
 * Character Extraction API Route
 *
 * Extracts characters from story content and analyzes their traits.
 * Uses direct OpenRouter calls (no yumeta.kr proxy).
 *
 * Model: openai/gpt-4o-mini
 */

import { NextResponse } from "next/server";
import {
  callOpenRouter,
  getOpenRouterKey,
  OpenRouterAPIError,
} from "@/lib/llm/openrouter";
import {
  extractCharacterNames,
  buildExtractCharactersRequest,
  parseCharactersResponse,
  type CharacterDetail,
} from "@/lib/prompts";

/* ─────────────────────────────────────────────────────────────────────────────
 * API Types
 * ───────────────────────────────────────────────────────────────────────────── */

export interface ExtractCharactersAPIRequest {
  story: string;
}

export interface ExtractCharactersAPIResponse {
  success: boolean;
  characters: Record<string, string>;
  characterDetails: CharacterDetail[];
  extractedNames: string[];
  rawAnalysis: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Route Handler
 * ───────────────────────────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body: ExtractCharactersAPIRequest = await request.json();

    /* Validate required fields */
    if (!body.story) {
      return NextResponse.json(
        { error: "story is required" },
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

    /* Pre-extract character names from dialogue patterns */
    const extractedNames = extractCharacterNames(body.story);

    if (extractedNames.length === 0) {
      return NextResponse.json({
        success: true,
        characters: {},
        characterDetails: [],
        extractedNames: [],
        rawAnalysis: "No characters found in story",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        model: "none",
      });
    }

    console.log(
      "[extract-characters] Found",
      extractedNames.length,
      "characters:",
      extractedNames
    );

    /* Build and send request */
    const requestParams = buildExtractCharactersRequest(
      { story: body.story },
      extractedNames
    );

    const result = await callOpenRouter(apiKey, requestParams);

    /* Parse response */
    const parsed = parseCharactersResponse(result.content, extractedNames);

    console.log(
      "[extract-characters] Analyzed",
      parsed.characterDetails.length,
      "characters"
    );

    const response: ExtractCharactersAPIResponse = {
      success: true,
      characters: parsed.characters,
      characterDetails: parsed.characterDetails,
      extractedNames: parsed.extractedNames,
      rawAnalysis: result.content,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
      },
      model: result.model,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[extract-characters] Error:", error);

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
      { error: "Failed to extract characters", details: message },
      { status: 500 }
    );
  }
}
