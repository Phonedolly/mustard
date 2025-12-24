/* User prompt generator extracted from yt-shorts-generator-3 */

import type { SelectedKeywords } from "../types";
import { genreOptions } from "../keywords";
import { horrorKeywordRef } from "./encoded";
import { decodePrompt } from "../utils";

/**
 * Generates the user prompt for story generation.
 *
 * The user prompt is relatively simple compared to the system prompt:
 * - Includes the genre (if specified)
 * - Adds horror keywords if mood is "scary"
 * - Ends with the topic/idea provided by the user
 *
 * Format: "[genre], [horror keywords], [topic]"
 *
 * Example outputs:
 * - "alba, topic about part-time job experience"
 * - "hakgyo, gwishin, creepy school story"
 * - "just the topic without genre"
 */
export const generateUserPrompt = (
  isHorror: boolean,
  keywords: SelectedKeywords
): string => {
  const { topic, genre, customGenre } = keywords;

  /* Build the prompt parts */
  const genrePart = genre
    ? genre === "custom"
      ? `${customGenre}, `
      : `${genreOptions[genre]}, `
    : "";

  /* Add random horror keyword if mood is scary */
  const horrorPart = isHorror
    ? `${decodePrompt(horrorKeywordRef[Math.floor(Math.random() * horrorKeywordRef.length)])}, `
    : "";

  const prompt = `${genrePart}${horrorPart}${topic}`;

  return prompt;
};
