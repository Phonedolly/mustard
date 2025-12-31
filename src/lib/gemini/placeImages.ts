/* Image placement logic using Gemini */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  IMAGE_PLACEMENT_SYSTEM_INSTRUCTION,
  buildImagePlacementPrompt,
} from "./prompts/imagePlacement";
import { GEMINI_MODEL_ID } from "./client";
import { calculateCost } from "@/lib/llm/pricing";
import type {
  Phrase,
  ImageDescription,
  ImagePlacement,
  LLMTokens,
  LLMCost,
} from "@/lib/core/types";

/*
 * Improvement Notes:
 * - Added responseMimeType: "application/json" to force JSON-only responses.
 * - Using systemInstruction instead of embedding system prompt in user content.
 * - Added detailed logging for debugging placement failures.
 * - The previous implementation often fell back to even distribution because
 *   Gemini would include markdown or explanatory text around the JSON.
 */

export interface ImagePlacementResult {
  placements: ImagePlacement[];
  usage: {
    model: string;
    tokens: LLMTokens;
    cost: LLMCost;
    latencyMs: number;
    finishReason?: string;
  };
}

/**
 * Determines optimal placement for images within the story structure.
 * Uses Gemini with JSON response mode for reliable structured output.
 * Returns both placements and usage metadata for logging.
 */
export async function placeImages(
  phrases: Phrase[],
  imageDescriptions: ImageDescription[],
  apiKey: string
): Promise<ImagePlacementResult> {
  const emptyUsage = {
    model: GEMINI_MODEL_ID,
    tokens: { input: 0, output: 0, total: 0 },
    cost: { input: 0, output: 0, total: 0, currency: "USD" as const },
    latencyMs: 0,
  };

  if (imageDescriptions.length === 0) {
    return { placements: [], usage: emptyUsage };
  }

  if (phrases.length === 0) {
    console.warn("placeImages: No phrases provided, using fallback");
    return {
      placements: createFallbackPlacements(imageDescriptions, phrases),
      usage: emptyUsage,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const startTime = Date.now();

  /*
   * Configure model with JSON response mode.
   * This forces Gemini to output only valid JSON, eliminating parsing issues.
   */
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_ID,
    systemInstruction: IMAGE_PLACEMENT_SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const userPrompt = buildImagePlacementPrompt(phrases, imageDescriptions);

  try {
    const result = await model.generateContent(userPrompt);
    const latencyMs = Date.now() - startTime;
    const response = result.response;
    const text = response.text();

    /* Extract usage metadata */
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;

    const tokens: LLMTokens = {
      input: inputTokens,
      output: outputTokens,
      total: inputTokens + outputTokens,
    };

    const cost = calculateCost(GEMINI_MODEL_ID, inputTokens, outputTokens);

    /* Get finish reason if available */
    const finishReason = response.candidates?.[0]?.finishReason;

    const usage = {
      model: GEMINI_MODEL_ID,
      tokens,
      cost,
      latencyMs,
      finishReason,
    };

    /* Log raw response for debugging (truncated) */
    console.log("Gemini placement response (first 500 chars):", text.slice(0, 500));

    /* Parse JSON response */
    let parsed: { placements?: unknown[] };
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);

      /* Attempt to extract JSON from response if it contains extra text */
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log("Extracted JSON from response");
        } catch {
          console.error("Failed to extract JSON from response");
          return {
            placements: createFallbackPlacements(imageDescriptions, phrases),
            usage,
          };
        }
      } else {
        return {
          placements: createFallbackPlacements(imageDescriptions, phrases),
          usage,
        };
      }
    }

    if (!parsed.placements || !Array.isArray(parsed.placements)) {
      console.error("Invalid placements structure:", parsed);
      return {
        placements: createFallbackPlacements(imageDescriptions, phrases),
        usage,
      };
    }

    /* Validate and clean up placements */
    const validPlacements = validatePlacements(
      parsed.placements,
      phrases,
      imageDescriptions.length
    );

    /* Check if we got valid placements for all images */
    if (validPlacements.length === 0) {
      console.warn("No valid placements found, using fallback");
      return {
        placements: createFallbackPlacements(imageDescriptions, phrases),
        usage,
      };
    }

    /* Fill in missing images if some were not placed */
    if (validPlacements.length < imageDescriptions.length) {
      console.warn(
        `Only ${validPlacements.length}/${imageDescriptions.length} images placed, filling gaps`
      );
      return {
        placements: fillMissingPlacements(validPlacements, imageDescriptions, phrases),
        usage,
      };
    }

    console.log(`Successfully placed ${validPlacements.length} images`);
    return { placements: validPlacements, usage };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Image placement API error:", error);

    return {
      placements: createFallbackPlacements(imageDescriptions, phrases),
      usage: {
        model: GEMINI_MODEL_ID,
        tokens: { input: 0, output: 0, total: 0 },
        cost: { input: 0, output: 0, total: 0, currency: "USD" as const },
        latencyMs,
      },
    };
  }
}

/**
 * Validates and cleans up placement data from Gemini response.
 */
function validatePlacements(
  rawPlacements: unknown[],
  phrases: Phrase[],
  imageCount: number
): ImagePlacement[] {
  const placements: ImagePlacement[] = [];
  const usedImageIndices = new Set<number>();

  for (const raw of rawPlacements) {
    if (typeof raw !== "object" || raw === null) {
      console.warn("Invalid placement object:", raw);
      continue;
    }

    const placement = raw as Record<string, unknown>;

    /* Validate imageIndex */
    if (
      typeof placement.imageIndex !== "number" ||
      placement.imageIndex < 0 ||
      placement.imageIndex >= imageCount
    ) {
      console.warn("Invalid imageIndex:", placement.imageIndex);
      continue;
    }

    /* Skip duplicate image placements */
    if (usedImageIndices.has(placement.imageIndex)) {
      console.warn("Duplicate imageIndex:", placement.imageIndex);
      continue;
    }

    /* Validate phraseIndex */
    let phraseIndex = 0;
    if (typeof placement.phraseIndex === "number") {
      phraseIndex = Math.max(0, Math.min(placement.phraseIndex, phrases.length - 1));
    }

    /* Validate type */
    const type = placement.type === "statement" ? "statement" : "phrase";

    /* Build valid placement */
    const validPlacement: ImagePlacement = {
      imageIndex: placement.imageIndex,
      type,
      phraseIndex,
      confidence:
        typeof placement.confidence === "number"
          ? Math.max(0, Math.min(1, placement.confidence))
          : 0.7,
      reason:
        typeof placement.reason === "string" && placement.reason.length > 0
          ? placement.reason
          : "AI 분석 결과에 따른 배치",
    };

    /* Validate statement indices if type is statement */
    if (type === "statement" && Array.isArray(placement.statementIndices)) {
      const phrase = phrases[phraseIndex];
      const maxStatementIndex = phrase ? phrase.statements.length - 1 : 0;
      validPlacement.statementIndices = (placement.statementIndices as number[])
        .filter((i): i is number => typeof i === "number" && i >= 0)
        .map((i) => Math.min(i, maxStatementIndex));

      if (validPlacement.statementIndices.length === 0) {
        validPlacement.statementIndices = [0];
      }
    }

    placements.push(validPlacement);
    usedImageIndices.add(placement.imageIndex);
  }

  return placements;
}

/**
 * Fills in placements for images that were not placed by AI.
 */
function fillMissingPlacements(
  existingPlacements: ImagePlacement[],
  imageDescriptions: ImageDescription[],
  phrases: Phrase[]
): ImagePlacement[] {
  const placedIndices = new Set(existingPlacements.map((p) => p.imageIndex));
  const result = [...existingPlacements];

  for (let i = 0; i < imageDescriptions.length; i++) {
    if (!placedIndices.has(i)) {
      /* Distribute unplaced images across remaining phrases */
      const usedPhrases = new Set(result.map((p) => p.phraseIndex));
      let targetPhrase = 0;

      /* Find an unused phrase if possible */
      for (let p = 0; p < phrases.length; p++) {
        if (!usedPhrases.has(p)) {
          targetPhrase = p;
          break;
        }
      }

      /* If all phrases used, distribute evenly */
      if (usedPhrases.size >= phrases.length) {
        targetPhrase = Math.floor((i / imageDescriptions.length) * phrases.length);
      }

      result.push({
        imageIndex: i,
        type: "phrase",
        phraseIndex: targetPhrase,
        confidence: 0.5,
        reason: "자동 배치 (AI 분석 보완)",
      });
    }
  }

  return result;
}

/**
 * Creates fallback placements when AI analysis fails.
 * Distributes images evenly across phrases.
 */
function createFallbackPlacements(
  imageDescriptions: ImageDescription[],
  phrases: Phrase[]
): ImagePlacement[] {
  console.log("Creating fallback placements for", imageDescriptions.length, "images");

  if (phrases.length === 0) {
    return imageDescriptions.map((_, i) => ({
      imageIndex: i,
      type: "phrase" as const,
      phraseIndex: 0,
      confidence: 0.3,
      reason: "Fallback: 씬 정보 없음",
    }));
  }

  return imageDescriptions.map((_, i) => {
    /* Distribute images evenly across all phrases */
    const phraseIndex = Math.floor((i / imageDescriptions.length) * phrases.length);

    return {
      imageIndex: i,
      type: "phrase" as const,
      phraseIndex: Math.min(phraseIndex, phrases.length - 1),
      confidence: 0.3,
      reason: "Fallback: 자동 분배",
    };
  });
}
