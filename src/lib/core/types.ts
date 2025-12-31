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

/*
 * LLM Usage Logging Types
 * Used for tracking token usage, costs, and performance across all LLM calls.
 */

export type LLMProvider = "openrouter" | "gemini";

export type LLMOperation =
  | "story_generation"
  | "split_scenes"
  | "image_analysis"
  | "image_placement";

export interface LLMTokens {
  input: number;
  output: number;
  total: number;
  cached?: number;
}

export interface LLMNativeTokens {
  input: number;
  output: number;
}

export interface LLMCost {
  total: number;
  input: number;
  output: number;
  cacheDiscount?: number;
  currency: "USD";
}

export interface LLMUsageLog {
  id: string;
  timestamp: string;
  operation: LLMOperation;
  provider: LLMProvider;
  model: string;
  success: boolean;
  error?: string;

  /* Token usage */
  tokens: LLMTokens;
  nativeTokens?: LLMNativeTokens;

  /* Cost calculation */
  cost: LLMCost;

  /* Performance metrics */
  latencyMs: number;
  generationTimeSec?: number;

  /* Provider-specific */
  generationId?: string;
  finishReason?: string;

  /* For batch operations (e.g., image analysis) */
  batchInfo?: {
    totalItems: number;
    itemLogs: LLMUsageLogItem[];
  };
}

export interface LLMUsageLogItem {
  index: number;
  tokens: LLMTokens;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface LLMUsageSession {
  startedAt: string;
  logs: LLMUsageLog[];
  totals: {
    tokens: number;
    cost: number;
    calls: number;
  };
}
