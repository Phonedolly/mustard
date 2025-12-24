/* Gemini API client setup */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

/**
 * Model ID for Gemini API.
 * Used for image analysis and placement tasks.
 */
export const GEMINI_MODEL_ID = "gemini-2.5-flash";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initializes the Google Generative AI client.
 * Lazily creates the client on first use.
 */
export const getGeminiClient = (apiKey: string): GoogleGenerativeAI => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Gets a configured Gemini model for text generation.
 */
export const getTextModel = (apiKey: string): GenerativeModel => {
  const client = getGeminiClient(apiKey);
  return client.getGenerativeModel({ model: GEMINI_MODEL_ID });
};

/**
 * Gets a configured Gemini model for vision tasks (image analysis).
 * Uses the same model since gemini-2.5-flash supports multimodal input.
 */
export const getVisionModel = (apiKey: string): GenerativeModel => {
  const client = getGeminiClient(apiKey);
  return client.getGenerativeModel({ model: GEMINI_MODEL_ID });
};
