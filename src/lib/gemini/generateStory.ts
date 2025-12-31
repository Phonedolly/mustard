/* Story generation using OpenRouter API with Claude */

import type { SelectedKeywords, LLMTokens, LLMCost } from "@/lib/core/types";
import { generateSystemPrompt, generateUserPrompt } from "@/lib/core";
import { calculateCost } from "@/lib/llm/pricing";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const STORY_MODEL = "anthropic/claude-sonnet-4.5";

export interface StoryGenerationResult {
  story: string;
  usage: {
    model: string;
    tokens: LLMTokens;
    cost: LLMCost;
    generationId?: string;
    latencyMs: number;
  };
}

/**
 * Generates a Korean "sseol" (story) using OpenRouter with Claude Sonnet 4.5.
 *
 * This matches the original yt-shorts-generator-3 approach of using
 * OpenRouter with Claude for story generation.
 *
 * Returns both the story content and detailed usage metadata for logging.
 */
export async function generateStory(
  keywords: SelectedKeywords,
  apiKey: string
): Promise<StoryGenerationResult> {
  const isHorror = keywords.mood === "scary";
  const systemPrompt = generateSystemPrompt("keyword", keywords);
  const userPrompt = generateUserPrompt(isHorror, keywords);

  const startTime = Date.now();

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: STORY_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 1.0,
        max_tokens: 8192,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty response from OpenRouter");
    }

    /*
     * Extract usage data from OpenRouter response.
     * OpenRouter returns normalized tokens via GPT4o tokenizer.
     */
    const inputTokens = data.usage?.prompt_tokens ?? 0;
    const outputTokens = data.usage?.completion_tokens ?? 0;
    const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;

    const tokens: LLMTokens = {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
      cached: cachedTokens > 0 ? cachedTokens : undefined,
    };

    /*
     * Calculate cost. OpenRouter may provide cost directly,
     * but we calculate it ourselves for consistency.
     */
    const cost = calculateCost(STORY_MODEL, inputTokens, outputTokens, cachedTokens);

    return {
      story: text.trim(),
      usage: {
        model: STORY_MODEL,
        tokens,
        cost,
        generationId: data.id,
        latencyMs,
      },
    };
  } catch (error) {
    console.error("Story generation failed:", error);
    throw error;
  }
}
