/* Phase 2: Type definitions extracted from yt-shorts-generator-3 domain */

export interface SelectedKeywords {
  topic: string;
  genre?: keyof typeof import("./keywords").genreOptions;
  customGenre?: string;
  mood?: keyof typeof import("./keywords").moodOptions;
  endingStyle?: keyof typeof import("./keywords").endingStyleOptions;
  mainCharacter: {
    gender?: "auto" | "male" | "female";
    age?: "auto" | "10s" | "20s" | "30s" | "40s" | "50s";
  };
  tone?: keyof typeof import("./keywords").toneOptions;
  length: "short" | "medium" | "long";
  rating: "mild" | "medium" | "hot";
  characterLimit: boolean;
  multiEnding: boolean;
  finishWithQuestion: boolean;
  additionalRequest?: string;
}

export interface ParsedScript {
  title: string;
  script: string[][];
  ending: string[][][];
  rawScript: string;
}

/*
 * Phrase: Top-level container representing a scene.
 * In yt-shorts-generator-3, a Phrase contains multiple Statements and optional media.
 * The original PhraseV2 schema includes fields like mode, postInterval, scriptStyle, etc.
 * For this PoC, we simplify to focus on the core hierarchy.
 */
export interface Phrase {
  id: string;
  index: number;
  statements: Statement[];
  metadata?: {
    location?: string;
    speaker?: string[];
  };
}

/*
 * Statement: Individual sentence/dialogue unit within a Phrase.
 * In yt-shorts-generator-3, Statements contain chunks (text, voice, image, video).
 * For this PoC, we focus on the text content.
 */
export interface Statement {
  id: string;
  index: number;
  text: string;
  displayText: string;
  pronunciation?: string;
}

export interface ImageDescription {
  index: number;
  description: string;
  dominantColors?: string[];
  mood?: string;
  subjects?: string[];
}

export interface ImagePlacement {
  imageIndex: number;
  type: "phrase" | "statement";
  phraseIndex: number;
  statementIndices?: number[];
  reason: string;
  confidence: number;
}

export interface SplitSceneResponse {
  success: boolean;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  model: string;
  token_info: {
    input_tokens: number;
    output_tokens: number;
  };
}
