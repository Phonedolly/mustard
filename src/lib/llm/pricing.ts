/* LLM Pricing Constants and Cost Calculator */

import type { LLMProvider, LLMCost } from "@/lib/core/types";

/*
 * Pricing data sourced from official documentation (December 2025):
 * - OpenRouter: https://openrouter.ai/anthropic/claude-sonnet-4.5
 * - Google AI: https://ai.google.dev/gemini-api/docs/pricing
 *
 * Prices are in USD per 1 million tokens.
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion?: number;
  cacheWritePerMillion?: number;
  /* Long context pricing (e.g., >200K tokens for Claude) */
  longContextMultiplier?: number;
  longContextThreshold?: number;
}

export const PRICING: Record<string, ModelPricing> = {
  /* Claude Sonnet 4.5 via OpenRouter */
  "anthropic/claude-sonnet-4.5": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cacheReadPerMillion: 0.3,
    cacheWritePerMillion: 3.75,
    longContextMultiplier: 1.5,
    longContextThreshold: 200000,
  },

  /* Gemini 2.5 Flash via Google AI */
  "gemini-2.5-flash": {
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
    cacheReadPerMillion: 0.03,
  },

  /* Fallback for unknown models */
  default: {
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
  },
};

/**
 * Calculate cost for a given token usage.
 *
 * @param model - Model identifier (e.g., "anthropic/claude-sonnet-4.5")
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param cachedTokens - Number of tokens read from cache (optional)
 * @returns Cost breakdown in USD
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number = 0
): LLMCost {
  const pricing = PRICING[model] || PRICING.default;

  /* Check if long context pricing applies */
  let inputMultiplier = 1;
  let outputMultiplier = 1;

  if (
    pricing.longContextThreshold &&
    pricing.longContextMultiplier &&
    inputTokens > pricing.longContextThreshold
  ) {
    inputMultiplier = pricing.longContextMultiplier;
    outputMultiplier = pricing.longContextMultiplier;
  }

  /* Calculate costs */
  const effectiveInputTokens = inputTokens - cachedTokens;
  const inputCost =
    (effectiveInputTokens / 1_000_000) *
    pricing.inputPerMillion *
    inputMultiplier;

  const outputCost =
    (outputTokens / 1_000_000) * pricing.outputPerMillion * outputMultiplier;

  const cacheCost = pricing.cacheReadPerMillion
    ? (cachedTokens / 1_000_000) * pricing.cacheReadPerMillion
    : 0;

  const cacheDiscount = cachedTokens > 0
    ? (cachedTokens / 1_000_000) * pricing.inputPerMillion * inputMultiplier - cacheCost
    : 0;

  return {
    input: inputCost + cacheCost,
    output: outputCost,
    total: inputCost + cacheCost + outputCost,
    cacheDiscount: cacheDiscount > 0 ? cacheDiscount : undefined,
    currency: "USD",
  };
}

/**
 * Format cost for display (e.g., "$0.0234" or "<$0.01")
 */
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return "<$0.001";
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * Format token count for display (e.g., "1,234" or "1.2K")
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 10_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}

/**
 * Get provider from model string
 */
export function getProviderFromModel(model: string): LLMProvider {
  if (model.startsWith("anthropic/") || model.startsWith("openai/")) {
    return "openrouter";
  }
  if (model.startsWith("gemini")) {
    return "gemini";
  }
  return "openrouter";
}
