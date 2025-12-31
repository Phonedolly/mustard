/**
 * Location Extraction API Route
 *
 * Adds location information to each scene in a story.
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
  buildGetLocationRequest,
  parseLocationResponse,
  type ProcessedScene,
} from "@/lib/prompts";

/* ─────────────────────────────────────────────────────────────────────────────
 * API Types
 * ───────────────────────────────────────────────────────────────────────────── */

export interface GetLocationAPIRequest {
  scenes: string[];
}

export interface GetLocationAPIResponse {
  success: boolean;
  originalScenes: string[];
  processedScenes: ProcessedScene[];
  rawOutput: string;
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
    const body: GetLocationAPIRequest = await request.json();

    /* Validate required fields */
    if (!body.scenes || !Array.isArray(body.scenes)) {
      return NextResponse.json(
        {
          error: "scenes is required and must be an array",
          hint: "Provide an array of scene strings",
        },
        { status: 400 }
      );
    }

    if (body.scenes.length === 0) {
      return NextResponse.json({
        success: true,
        originalScenes: [],
        processedScenes: [],
        rawOutput: "",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        model: "none",
      });
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

    console.log("[get-location] Processing", body.scenes.length, "scenes");

    /* Build and send request */
    const requestParams = buildGetLocationRequest({ scenes: body.scenes });

    const result = await callOpenRouter(apiKey, requestParams);

    /* Parse response */
    const parsed = parseLocationResponse(result.content, body.scenes);

    console.log(
      "[get-location] Added locations to",
      parsed.processedScenes.filter((s) => s.location).length,
      "scenes"
    );

    const response: GetLocationAPIResponse = {
      success: true,
      originalScenes: parsed.originalScenes,
      processedScenes: parsed.processedScenes,
      rawOutput: result.content,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        totalTokens: result.usage.totalTokens,
      },
      model: result.model,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[get-location] Error:", error);

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
      { error: "Failed to get locations", details: message },
      { status: 500 }
    );
  }
}
