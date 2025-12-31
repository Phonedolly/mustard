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

  /*
   * Build concrete JSON examples showing both scope types.
   * Gemini learns better from diverse examples than abstract rules.
   */
  const examplePlacements = [];

  /* Example 1: phrase-level (scene background) */
  if (imageDescriptions.length > 0) {
    examplePlacements.push({
      imageIndex: imageDescriptions[0].index,
      type: "phrase",
      phraseIndex: 0,
      confidence: 0.85,
      reason: "배경/분위기 이미지 - 씬 전체의 무드와 어울림 (scope: phrase)",
    });
  }

  /* Example 2: statement-level (specific content) */
  if (imageDescriptions.length > 1 && phrases.length > 0) {
    const targetPhrase = Math.min(1, phrases.length - 1);
    const maxStmt = phrases[targetPhrase]?.statements.length - 1 || 0;
    examplePlacements.push({
      imageIndex: imageDescriptions[1].index,
      type: "statement",
      phraseIndex: targetPhrase,
      statementIndices: [Math.min(1, maxStmt)],
      confidence: 0.9,
      reason: "특정 물체 이미지 - 해당 문장에서 언급된 내용과 직접 연결 (scope: statement)",
    });
  }

  const jsonExample = JSON.stringify({ placements: examplePlacements }, null, 2);

  /*
   * Prompt structure follows "Lost in the Middle" research:
   * - CRITICAL CONSTRAINTS at top (primacy effect)
   * - Soft guidelines in middle
   * - JSON reminder at end (recency effect)
   */
  return `## Task
Analyze the images below and determine where each should be placed in the story.

## CRITICAL CONSTRAINTS (must follow)
1. One Phrase can have at most 1 phrase-scope image
2. One Statement can have at most 1 image
3. On conflict, the image with higher confidence takes the position
4. Every image must be placed exactly once

## Story Structure (${phrases.length} scenes)

${storyStructure}

## Images to Place (${imageDescriptions.length} images)

${imagesInfo}

## Output Requirements

Return a JSON object with this EXACT structure:
${jsonExample}

Field definitions:
- imageIndex: 이미지 번호 (0 to ${imageDescriptions.length - 1})
- type: "phrase" (씬 전체 배경) 또는 "statement" (특정 문장)
- phraseIndex: 씬 번호 (0 to ${phrases.length - 1})
- statementIndices: [type="statement"일 때 필수] 해당 문장 인덱스 배열
- confidence: 적합도 (0.0 to 1.0)
- reason: 한국어로 배치 이유 설명

## Scope Selection Guide

### "phrase" scope:
- 배경/분위기/장소 이미지
- 씬 전체의 무드를 설정
- 이미지 수가 씬 수보다 적을 때

### "statement" scope:
- 특정 물체/행동 이미지
- 문장에서 직접 언급된 내용
- statementIndices로 범위 지정 (단일: [2], 연속: [2, 3, 4])
- 숏폼 특성상 적절한 노출 시간 고려

## Placement Strategy

1. 이미지 내용과 스토리 매칭:
   - 음식 이미지 → 음식 언급 문장 (statement)
   - 장소 이미지 → 해당 씬 전체 (phrase)

2. 서사 흐름 고려:
   - 중요 이미지는 핵심 순간에
   - 보조 이미지는 자연스럽게 분배

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
