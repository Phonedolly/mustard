/* Script parsing logic extracted from yt-shorts-generator-3/generateAiScript/index.ts */

import type { ParsedScript, Phrase, Statement } from "./types";
import { generateId } from "./utils";

/*
 * Parsing Issue Notes:
 * - yumeta.kr API returns scene-split content, but the format can vary.
 * - Previous implementation assumed `\n\n` separates scenes, but API might use
 *   single newlines or inconsistent formatting.
 * - Now using scene header detection as primary delimiter.
 */

/**
 * Parses a raw script string into structured Phrases and Statements.
 *
 * Input format (from AI generation):
 * ```
 * Title Here
 *
 * scene 1
 * First line of dialogue
 * Second line
 *
 * scene 2
 * More dialogue...
 * ```
 */
export const parseScript = (script: string): ParsedScript => {
  const result: ParsedScript = {
    title: "",
    script: [],
    ending: [],
    rawScript: script,
  };

  const phrases = script.split("\n\n");

  if (phrases.length === 0) {
    throw new Error("Script must contain at least one phrase.");
  }

  /* First phrase is the title */
  result.title = phrases.shift()?.trim() ?? "";

  const endingA: string[][] = [];
  const endingB: string[][] = [];

  for (const phrase of phrases) {
    const _statements = phrase.split("\n");
    const sceneIndex = _statements.shift()?.trim();

    const statements = _statements.map((statement) => {
      return statement.replace(/^\([^)]*\)/, "").trim();
    });

    const filteredStatements = statements.filter((s) => s.length > 0);

    if (filteredStatements.length === 0) continue;

    if (sceneIndex && sceneIndex.endsWith("A")) {
      endingA.push(filteredStatements);
    } else if (sceneIndex && sceneIndex.endsWith("B")) {
      endingB.push(filteredStatements);
    } else {
      result.script.push(filteredStatements);
    }
  }

  if (endingA.length > 0 && endingB.length > 0) {
    result.ending.push(endingA, endingB);
  }

  return result;
};

/**
 * Converts a ParsedScript into structured Phrases with proper IDs.
 */
export const parsedScriptToPhrases = (parsed: ParsedScript): Phrase[] => {
  return parsed.script.map((statementTexts, phraseIndex) => ({
    id: generateId(),
    index: phraseIndex,
    statements: statementTexts.map((text, statementIndex) => ({
      id: generateId(),
      index: statementIndex,
      text,
      displayText: text,
    })),
  }));
};

/**
 * Parses the split_scene API response format into Phrases.
 *
 * This function handles multiple possible formats from yumeta.kr API:
 *
 * Format 1 (Double newline separated):
 * ```
 * scene 1
 * First line
 * Second line
 *
 * scene 2
 * More content...
 * ```
 *
 * Format 2 (Single newline, scene headers inline):
 * ```
 * scene 1
 * First line
 * Second line
 * scene 2
 * More content...
 * ```
 *
 * The parser uses scene headers (e.g., "scene 1", "scene 2") as delimiters
 * rather than relying solely on blank lines.
 */
export const parseSplitSceneContent = (content: string): Phrase[] => {
  /* Normalize line endings */
  const normalizedContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  /* Split into lines */
  const allLines = normalizedContent.split("\n");

  /* Debug logging */
  console.log("parseSplitSceneContent: Total lines:", allLines.length);

  /*
   * Strategy: Find all scene headers and group lines between them.
   * Scene header pattern: "scene N" or "Scene N" (case insensitive)
   */
  const sceneHeaderPattern = /^scene\s+\d+(-[AB])?$/i;

  const phrases: Phrase[] = [];
  let currentSceneLines: string[] = [];
  let currentSceneNumber: string | null = null;

  for (const line of allLines) {
    const trimmedLine = line.trim();

    /* Check if this line is a scene header */
    if (sceneHeaderPattern.test(trimmedLine)) {
      /* Save previous scene if it has content */
      if (currentSceneNumber !== null && currentSceneLines.length > 0) {
        phrases.push(createPhraseFromLines(phrases.length, currentSceneLines));
      }

      /* Start new scene */
      currentSceneNumber = trimmedLine;
      currentSceneLines = [];
    } else if (trimmedLine.length > 0 && currentSceneNumber !== null) {
      /* Add line to current scene */
      currentSceneLines.push(trimmedLine);
    } else if (trimmedLine.length > 0 && currentSceneNumber === null) {
      /*
       * Content before first scene header - this shouldn't happen with
       * proper API response, but handle gracefully by starting scene 0
       */
      currentSceneNumber = "scene 0";
      currentSceneLines.push(trimmedLine);
    }
  }

  /* Don't forget the last scene */
  if (currentSceneNumber !== null && currentSceneLines.length > 0) {
    phrases.push(createPhraseFromLines(phrases.length, currentSceneLines));
  }

  /* If no scenes were found, try fallback parsing */
  if (phrases.length === 0) {
    console.warn("No scene headers found, attempting fallback parsing");
    return fallbackParseSplitSceneContent(normalizedContent);
  }

  console.log("parseSplitSceneContent: Parsed", phrases.length, "scenes");
  console.log(
    "parseSplitSceneContent: Statement counts:",
    phrases.map((p) => p.statements.length)
  );

  return phrases;
};

/**
 * Creates a Phrase from an array of statement lines.
 */
function createPhraseFromLines(index: number, lines: string[]): Phrase {
  return {
    id: generateId(),
    index,
    statements: lines.map((text, statementIndex) => ({
      id: generateId(),
      index: statementIndex,
      text,
      displayText: text,
    })),
  };
}

/**
 * Fallback parsing when no scene headers are found.
 * Attempts to split by double newlines, or treats entire content as one scene.
 */
function fallbackParseSplitSceneContent(content: string): Phrase[] {
  /* Try splitting by double newlines */
  const blocks = content.split(/\n\n+/).filter((b) => b.trim().length > 0);

  if (blocks.length > 1) {
    console.log("Fallback: Using double-newline separation, found", blocks.length, "blocks");

    return blocks.map((block, index) => {
      const lines = block.split("\n").filter((l) => l.trim().length > 0);

      return {
        id: generateId(),
        index,
        statements: lines.map((text, si) => ({
          id: generateId(),
          index: si,
          text: text.trim(),
          displayText: text.trim(),
        })),
      };
    });
  }

  /* Last resort: treat every 3-5 lines as a scene */
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  console.log("Fallback: Grouping", lines.length, "lines into scenes");

  const LINES_PER_SCENE = 4;
  const phrases: Phrase[] = [];

  for (let i = 0; i < lines.length; i += LINES_PER_SCENE) {
    const sceneLines = lines.slice(i, Math.min(i + LINES_PER_SCENE, lines.length));

    phrases.push({
      id: generateId(),
      index: phrases.length,
      statements: sceneLines.map((text, si) => ({
        id: generateId(),
        index: si,
        text: text.trim(),
        displayText: text.trim(),
      })),
    });
  }

  return phrases;
}
