/**
 * Character Extraction Prompt
 *
 * Extracts and analyzes characters from story content.
 * First extracts character names via regex, then uses LLM to analyze traits.
 * Ported from: docs/duyo_api/extract_characters.php
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

export interface ExtractCharactersInput {
  story: string;
}

export interface CharacterDetail {
  name: string;
  rawTraits: string;
  mood1?: string;
  mood2?: string;
  age?: string;
  sex?: string;
}

export interface ParsedCharacters {
  characters: Record<string, string>;
  characterDetails: CharacterDetail[];
  extractedNames: string[];
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pre-processing: Extract Character Names
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Extract character names from story using dialogue pattern.
 *
 * Looks for pattern: (CharacterName)"dialogue"
 * Returns unique character names found in the story.
 */
export function extractCharacterNames(story: string): string[] {
  const pattern = /\(([^)]+)\)\s*"/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(story)) !== null) {
    names.add(match[1].trim());
  }

  return Array.from(names);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Prompt Template
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Build system prompt for character analysis.
 *
 * Includes the pre-extracted character names to guide the LLM.
 */
function buildSystemPrompt(characterNames: string[]): string {
  const characterList = characterNames.map((name) => `- (${name})`).join("\n");

  return `#Instructions
Based on the input, write the following in Korean.
- Format: (girlfriend): (calm, sophisticated, 20s, female)
- Display ALL characters without omission.
- You MUST use the given character names.
- Do not write any additional explanations.

# Output Format
- (Character1) : (mood1, mood2, age, sex)
- (Character2) : (mood1, mood2, age, sex)
- (Character3) : (mood1, mood2, age, sex)
...
${characterList}`;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Request Builder
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Build OpenRouter request parameters for character extraction.
 *
 * Note: Call extractCharacterNames() first to get the character list,
 * then pass it along with the story to this function.
 */
export function buildExtractCharactersRequest(
  input: ExtractCharactersInput,
  characterNames: string[]
): CallOpenRouterParams {
  const { story } = input;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: buildSystemPrompt(characterNames) },
    { role: "user", content: story },
  ];

  return {
    model: MODELS.GPT_4O_MINI,
    messages,
    maxTokens: DEFAULT_PARAMS.characterExtraction.maxTokens,
    temperature: DEFAULT_PARAMS.characterExtraction.temperature,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Response Parser
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Parse character analysis response into structured format.
 *
 * Format: (CharacterName) : (mood1, mood2, age, sex)
 */
export function parseCharactersResponse(
  rawResponse: string,
  extractedNames: string[]
): ParsedCharacters {
  const characters: Record<string, string> = {};
  const characterDetails: CharacterDetail[] = [];

  // Pattern: (Name) : (traits)
  const pattern = /\(([^)]+)\)\s*:\s*\(([^)]+)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rawResponse)) !== null) {
    const name = match[1].trim();
    const traits = match[2].trim();

    characters[name] = traits;

    // Parse trait parts
    const traitParts = traits.split(",").map((t) => t.trim());

    const detail: CharacterDetail = {
      name,
      rawTraits: traits,
    };

    if (traitParts.length >= 4) {
      detail.mood1 = traitParts[0];
      detail.mood2 = traitParts[1];
      detail.age = traitParts[2];
      detail.sex = traitParts[3];
    }

    characterDetails.push(detail);
  }

  return {
    characters,
    characterDetails,
    extractedNames,
  };
}
