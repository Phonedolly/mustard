/**
 * Story Refinement API Route
 *
 * Enables AI-powered story editing through chat interaction.
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
  buildRefineStoryRequest,
  parseRefineResponse,
  type ConversationMessage,
} from "@/lib/prompts";

/* ─────────────────────────────────────────────────────────────────────────────
 * API Types (backwards compatible)
 * ───────────────────────────────────────────────────────────────────────────── */

export interface RefineStoryAPIRequest {
  message: string;
  hookContent: string;
  bodyContent: string;
  ctaContent: string;
  conversationHistory?: ConversationMessage[];
  model?: string; // Kept for compatibility but ignored (always uses GPT-4o)
}

export interface RefineStoryAPIResponse {
  success: boolean;
  response: string;
  model: string;
  parsed?: {
    hook?: string;
    body?: string;
    cta?: string;
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Route Handler
 * ───────────────────────────────────────────────────────────────────────────── */

export async function POST(request: Request) {
  try {
    const body: RefineStoryAPIRequest = await request.json();

    /* Validate required fields */
    if (!body.message) {
      return NextResponse.json(
        { error: "message is required" },
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

    console.log("[refine-story] Processing message:", body.message.slice(0, 50) + "...");
    console.log("[refine-story] Conversation history length:", body.conversationHistory?.length || 0);

    /* Build and send request */
    const requestParams = buildRefineStoryRequest({
      message: body.message,
      storyContent: {
        hookContent: body.hookContent || "",
        bodyContent: body.bodyContent || "",
        ctaContent: body.ctaContent || "",
      },
      conversationHistory: body.conversationHistory,
    });

    const result = await callOpenRouter(apiKey, requestParams);

    /* Parse response */
    const parsed = parseRefineResponse(result.content);

    console.log("[refine-story] Response received, parsed sections:",
      [parsed.hook && "hook", parsed.body && "body", parsed.cta && "cta"]
        .filter(Boolean)
        .join(", ") || "none"
    );

    const response: RefineStoryAPIResponse = {
      success: true,
      response: parsed.response || result.content,
      model: result.model,
      parsed: {
        hook: parsed.hook,
        body: parsed.body,
        cta: parsed.cta,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[refine-story] Error:", error);

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
      { error: "Failed to refine story", details: message },
      { status: 500 }
    );
  }
}
