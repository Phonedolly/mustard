/* System prompt generator extracted from yt-shorts-generator-3 */

import type { SelectedKeywords } from "../types";
import { decodePrompt } from "../utils";
import {
  mainCharacterGenderOptions,
  mainCharacterAgeOptions,
  endingStyleOptions,
} from "../keywords";
import {
  rolePromptRef,
  modeKeywordPromptRef,
  storyConceptPromptRef,
  moodKeywordsRef,
  ratePromptRef,
  rateKeywordPromptRef,
  formPromptRef,
  formatPromptRef,
  lengthKeywordPromptRef,
  multiEndingPromptRef,
  finalQuestionPromptRef,
  additionalRequestPromptRef,
  toneKeywordPromptRef,
  prefillPromptRef,
} from "./encoded";

/**
 * Generates the system prompt for story generation.
 *
 * The original implementation constructs the prompt by concatenating:
 * 1. Role definition (who the AI should act as)
 * 2. Mode instructions (keyword-based or dramatize)
 * 3. Story concept (character, mood, ending style)
 * 4. Rating constraints (mild/medium/hot content level)
 * 5. Form rules (dialogue format, character limits)
 * 6. Format rules (scene structure, line length)
 * 7. Multi-ending instructions (if enabled)
 * 8. Final question instructions (if enabled)
 * 9. Additional requests from user
 * 10. Tone/dialect instructions
 * 11. Prefill guidance
 *
 * Note: The prompts are base64 encoded in the original codebase.
 * This is a simple obfuscation, not security measure.
 */
export const generateSystemPrompt = (
  mode: "keyword" | "dramatize",
  keywords: SelectedKeywords
): string => {
  const {
    mood,
    endingStyle,
    tone,
    length,
    rating,
    characterLimit,
    multiEnding,
    finishWithQuestion,
    additionalRequest,
    mainCharacter,
  } = keywords;

  /* Role prompt: defines the AI's persona */
  const rolePrompt = decodePrompt(rolePromptRef);

  /* Mode prompt: instructions for keyword or dramatize mode */
  const modePrompt = decodePrompt(modeKeywordPromptRef[mode]);

  /* Story concept prompt: character details, mood, ending style */
  const storyConceptPrompt =
    (mainCharacter.age && mainCharacter.gender) || mood || endingStyle
      ? decodePrompt(storyConceptPromptRef[0]) +
        `${
          mainCharacter.age && mainCharacter.gender
            ? decodePrompt(storyConceptPromptRef[1]) +
              `${mainCharacterAgeOptions[mainCharacter.age]} ${mainCharacterGenderOptions[mainCharacter.gender]}`
            : ""
        }` +
        `${
          mood && mood !== "auto" && moodKeywordsRef[mood]
            ? decodePrompt(storyConceptPromptRef[2]) +
              `${decodePrompt(moodKeywordsRef[mood][Math.floor(Math.random() * moodKeywordsRef[mood].length)])}` +
              decodePrompt(storyConceptPromptRef[3])
            : ""
        }` +
        `${
          endingStyle && endingStyle !== "auto"
            ? decodePrompt(storyConceptPromptRef[4]) +
              `${endingStyleOptions[endingStyle]}` +
              decodePrompt(storyConceptPromptRef[5])
            : ""
        }`
      : "";

  /* Rating prompt: content intensity level */
  const ratePrompt =
    decodePrompt(ratePromptRef[0]) + `${decodePrompt(rateKeywordPromptRef[rating])}`;

  /* Form prompt: dialogue formatting rules */
  const formPrompt =
    decodePrompt(formPromptRef[0]) +
    `${characterLimit ? decodePrompt(formPromptRef[1]) : ""}` +
    decodePrompt(formPromptRef[2]);

  /* Format prompt: scene structure and length */
  const formatPrompt =
    decodePrompt(formatPromptRef[0]) +
    `${decodePrompt(lengthKeywordPromptRef[length])}` +
    decodePrompt(formatPromptRef[1]);

  /* Multi-ending prompt: instructions for A/B endings */
  const multiEndingPrompt = multiEnding ? decodePrompt(multiEndingPromptRef) : "";

  /* Final question prompt: end with a question */
  const finalQuestionPrompt = finishWithQuestion
    ? decodePrompt(finalQuestionPromptRef)
    : "";

  /* Additional request: user's custom instructions */
  const additionalRequestPrompt = additionalRequest
    ? decodePrompt(additionalRequestPromptRef[0]) + `${additionalRequest}`
    : "";

  /* Tone prompt: dialect and speech style */
  const tonePrompt = decodePrompt(
    toneKeywordPromptRef[tone === undefined || tone === "auto" ? "auto" : tone]
  );

  /* Prefill prompt: guidance for response format */
  const prefillPrompt = decodePrompt(prefillPromptRef);

  /* Concatenate all prompt sections */
  const prompt = `${rolePrompt}${modePrompt} ${storyConceptPrompt} ${ratePrompt} ${formPrompt} ${formatPrompt} ${multiEndingPrompt} ${finalQuestionPrompt} ${additionalRequestPrompt}\n\n${prefillPrompt}\n\n${tonePrompt}`;

  return prompt;
};
