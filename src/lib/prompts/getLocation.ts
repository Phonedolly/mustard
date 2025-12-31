/**
 * Location Extraction Prompt
 *
 * Adds location information to each scene in a story.
 * Ported from: docs/duyo_api/get_location.php
 *
 * Model: openai/gpt-4o-mini
 */

import {
  type CallOpenRouterParams,
  type OpenRouterMessage,
  MODELS,
  DEFAULT_PARAMS,
} from "../llm/openrouter";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

export interface GetLocationInput {
  scenes: string[];
}

export interface ProcessedScene {
  location: string | null;
  scene: string;
  fullText: string;
}

export interface ParsedLocations {
  originalScenes: string[];
  processedScenes: ProcessedScene[];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Prompt Template
 * ───────────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `#Instructions

Add location information before each scene (string[]).
Do not provide any other explanations, answers, or elaborations.

# Output Format
(Korean BBQ restaurant) string[]
(In front of convenience store) string[]
(Office) string[]
(Living room) string[]
(School gate) string[]
...

# Rules
1. Analyze the content of each scene and infer the most appropriate location.
2. Express the location simply and clearly.
3. Keep the original text as-is and only add (location) at the beginning.
4. Add a location to ALL scenes without omission.`;

/* ─────────────────────────────────────────────────────────────────────────────
 * Request Builder
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Build user message from scenes array.
 */
function buildUserMessage(scenes: string[]): string {
  return scenes
    .map((scene, index) => `Scene${index + 1}: ${scene}`)
    .join("\n");
}

/**
 * Build OpenRouter request parameters for location extraction.
 */
export function buildGetLocationRequest(
  input: GetLocationInput
): CallOpenRouterParams {
  const { scenes } = input;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(scenes) },
  ];

  return {
    model: MODELS.GPT_4O_MINI,
    messages,
    maxTokens: DEFAULT_PARAMS.locationExtraction.maxTokens,
    temperature: DEFAULT_PARAMS.locationExtraction.temperature,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Response Parser
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Parse location response into structured format.
 *
 * Expects format: (Location) scene content
 */
export function parseLocationResponse(
  rawResponse: string,
  originalScenes: string[]
): ParsedLocations {
  const lines = rawResponse.split("\n").filter((line) => line.trim());
  const processedScenes: ProcessedScene[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Pattern: (Location) content
    const match = trimmedLine.match(/^\(([^)]+)\)\s*(.+)$/);

    if (match) {
      processedScenes.push({
        location: match[1].trim(),
        scene: match[2].trim(),
        fullText: trimmedLine,
      });
    } else {
      // No location found, keep original
      processedScenes.push({
        location: null,
        scene: trimmedLine,
        fullText: trimmedLine,
      });
    }
  }

  return {
    originalScenes,
    processedScenes,
  };
}
