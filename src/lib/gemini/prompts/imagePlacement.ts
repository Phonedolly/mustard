/* Image placement prompts for Gemini */

import type { Phrase, ImageDescription } from "@/lib/core/types";

/*
 * Prompt Design Notes:
 * - Previous prompt used TypeScript-style type annotations in JSON examples,
 *   which caused Gemini to output invalid JSON (e.g., "type": "phrase" | "statement").
 * - Now using concrete JSON examples with actual values.
 * - Added explicit instructions to output ONLY valid JSON.
 */

/**
 * System instruction for image placement analysis.
 * This is passed to Gemini as systemInstruction, not as user content.
 */
export const IMAGE_PLACEMENT_SYSTEM_INSTRUCTION = `You are an expert content editor for Korean short-form video content.
Your task: Analyze images and story structure, then determine optimal placement for each image.

CRITICAL: You must respond with ONLY a valid JSON object. No explanations, no markdown, no code blocks.`;

/**
 * Builds the complete prompt for image placement.
 * Includes story structure, image descriptions, and placement rules.
 */
export const buildImagePlacementPrompt = (
  phrases: Phrase[],
  imageDescriptions: ImageDescription[]
): string => {
  /* Format story structure with clear hierarchy */
  const storyStructure = phrases
    .map((phrase, pi) => {
      const statements = phrase.statements
        .map((s, si) => `  [${si}] ${s.displayText}`)
        .join("\n");
      return `Scene ${pi}:\n${statements}`;
    })
    .join("\n\n");

  /* Format image descriptions */
  const imagesInfo = imageDescriptions
    .map((img) => {
      const parts = [
        `Image ${img.index}:`,
        `  Description: ${img.description}`,
      ];
      if (img.mood) parts.push(`  Mood: ${img.mood}`);
      if (img.subjects?.length) parts.push(`  Subjects: ${img.subjects.join(", ")}`);
      return parts.join("\n");
    })
    .join("\n\n");

  /* Build concrete JSON example based on actual data */
  const examplePlacements = imageDescriptions.slice(0, 2).map((img, i) => ({
    imageIndex: img.index,
    type: "phrase",
    phraseIndex: Math.min(i, phrases.length - 1),
    confidence: 0.85,
    reason: "Example reason in Korean",
  }));

  const jsonExample = JSON.stringify({ placements: examplePlacements }, null, 2);

  return `## Task
Analyze the images below and determine where each should be placed in the story.

## Story Structure (${phrases.length} scenes)

${storyStructure}

## Images to Place (${imageDescriptions.length} images)

${imagesInfo}

## Output Requirements

Return a JSON object with this EXACT structure:
${jsonExample}

Field definitions:
- imageIndex: The image number (0 to ${imageDescriptions.length - 1})
- type: Either "phrase" (covers entire scene) or "statement" (specific lines only)
- phraseIndex: Scene number where image should appear (0 to ${phrases.length - 1})
- confidence: How well the image fits (0.0 to 1.0)
- reason: Brief Korean explanation of why this placement works

## Placement Strategy

1. Match image content to scene content:
   - Food images -> scenes mentioning food/eating
   - Location images -> scenes describing places
   - Emotion images -> scenes with matching emotional tone

2. Consider narrative flow:
   - Important images at key story moments
   - Supporting images distributed naturally

3. Each image must be placed exactly once.

Respond with ONLY the JSON object, no other text.`;
};

/**
 * Prompt for analyzing a single image.
 * Used by /api/analyze-images to extract image descriptions.
 */
export const IMAGE_ANALYSIS_PROMPT = `Analyze this image for content placement purposes.

Return ONLY a JSON object with this structure:
{
  "description": "What's shown in the image (in Korean, 1-2 sentences)",
  "mood": "emotional tone (e.g., happy, sad, tense, calm, warm, cold)",
  "subjects": ["main", "subjects", "in", "image"],
  "dominantColors": ["#hex1", "#hex2", "#hex3"]
}

Rules:
- description: Korean description of the image content
- mood: Single English word for the emotional tone
- subjects: 2-5 main subjects as English words
- dominantColors: 2-3 hex color codes (e.g., "#FF5733", "#1A2B3C")

Respond with ONLY the JSON object, no other text.`;

/*
 * Legacy export for backward compatibility.
 * The system prompt is now passed via systemInstruction in the API call.
 */
export const IMAGE_PLACEMENT_SYSTEM_PROMPT = IMAGE_PLACEMENT_SYSTEM_INSTRUCTION;
