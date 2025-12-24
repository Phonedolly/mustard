/* Story generation prompts for Gemini */

import type { SelectedKeywords } from "@/lib/core/types";
import { generateSystemPrompt, generateUserPrompt } from "@/lib/core";

/**
 * Generates the full prompt for story generation using Gemini.
 *
 * The original yt-shorts-generator-3 used OpenRouter with Claude 3.5 Sonnet.
 * We're adapting the same prompt structure for Gemini 3.0 Flash.
 *
 * Key differences from original:
 * - Combined system + user prompt (Gemini uses single prompt format)
 * - Adjusted for Gemini's response characteristics
 */
export const buildStoryGenerationPrompt = (
  keywords: SelectedKeywords
): string => {
  const isHorror = keywords.mood === "scary";
  const systemPrompt = generateSystemPrompt("keyword", keywords);
  const userPrompt = generateUserPrompt(isHorror, keywords);

  /*
   * Gemini works best with clear structure and explicit instructions.
   * We combine the system context with user input in a single prompt.
   */
  return `${systemPrompt}

---

User's story request:
${userPrompt}

---

Please generate the story following the format and rules specified above.
Start with the title on the first line.`;
};

/**
 * Fallback prompt for simple story generation without complex keywords.
 * Used when user provides just a topic without detailed settings.
 */
export const buildSimpleStoryPrompt = (topic: string): string => {
  return `You are a Korean story writer specializing in short-form "sseol" (story) content for social media.

Write a short Korean story (sseol) about the following topic:
${topic}

Format requirements:
1. Start with a catchy title on the first line
2. Use "scene N" format to separate scenes (scene 1, scene 2, etc.)
3. Each scene should have 2-4 short lines
4. Each line should be around 8 characters
5. Use casual Korean tone (like internet storytelling)
6. Make it engaging and relatable
7. Include dialogue in format: (character)"dialogue"

Example format:
Title Here

scene 1
First line
Second line

scene 2
(character)"dialogue"
More content...`;
};
