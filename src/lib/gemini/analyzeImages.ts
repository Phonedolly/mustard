/* Image analysis using Gemini Vision */

import { getVisionModel } from "./client";
import { IMAGE_ANALYSIS_PROMPT } from "./prompts/imagePlacement";
import type { ImageDescription } from "@/lib/core/types";

/*
 * Concurrency limit for parallel image analysis.
 * Balances speed vs API rate limits. Gemini allows ~10 concurrent requests.
 */
const CONCURRENCY_LIMIT = 8;

/**
 * Runs tasks with a concurrency limit.
 * Unlike Promise.all (all at once) or sequential (one at a time),
 * this processes up to `limit` tasks in parallel at any given moment.
 *
 * Example with 20 images and limit=8:
 * - First 8 start immediately
 * - As each completes, next one starts
 * - Results maintain original order
 */
async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  /* Spawn `limit` workers that pull from the shared queue */
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Analyzes images and extracts descriptions for placement purposes.
 * Uses concurrent processing with a limit to balance speed and rate limits.
 *
 * Previously: Sequential processing (slow, N API calls one after another)
 * Now: Parallel processing with concurrency limit (faster, up to 8 concurrent calls)
 */
export async function analyzeImages(
  imageFiles: File[],
  apiKey: string
): Promise<ImageDescription[]> {
  const model = getVisionModel(apiKey);

  const tasks = imageFiles.map((file, index) => ({
    file,
    index,
  }));

  return runWithConcurrency(
    tasks,
    async (task) => analyzeImageFromFile(task.file, task.index, model),
    CONCURRENCY_LIMIT
  );
}

/**
 * Analyzes images from base64 strings (for server-side usage).
 * Uses concurrent processing with a limit to balance speed and rate limits.
 */
export async function analyzeImagesFromBase64(
  images: Array<{ data: string; mimeType: string }>,
  apiKey: string
): Promise<ImageDescription[]> {
  const model = getVisionModel(apiKey);

  const tasks = images.map((image, index) => ({
    image,
    index,
  }));

  return runWithConcurrency(
    tasks,
    async (task) => analyzeImageFromBase64(task.image, task.index, model),
    CONCURRENCY_LIMIT
  );
}

/**
 * Analyzes a single image from File and returns structured description.
 */
async function analyzeImageFromFile(
  file: File,
  index: number,
  model: ReturnType<typeof getVisionModel>
): Promise<ImageDescription> {
  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "image/jpeg";

    return await callGeminiForAnalysis(base64Data, mimeType, index, model);
  } catch (error) {
    console.error(`Failed to analyze image ${index}:`, error);
    return createFallbackDescription(index);
  }
}

/**
 * Analyzes a single image from base64 data and returns structured description.
 */
async function analyzeImageFromBase64(
  image: { data: string; mimeType: string },
  index: number,
  model: ReturnType<typeof getVisionModel>
): Promise<ImageDescription> {
  try {
    return await callGeminiForAnalysis(image.data, image.mimeType, index, model);
  } catch (error) {
    console.error(`Failed to analyze image ${index}:`, error);
    return createFallbackDescription(index);
  }
}

/**
 * Core function that calls Gemini API to analyze an image.
 * Extracted to avoid duplication between File and base64 code paths.
 */
async function callGeminiForAnalysis(
  base64Data: string,
  mimeType: string,
  index: number,
  model: ReturnType<typeof getVisionModel>
): Promise<ImageDescription> {
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: IMAGE_ANALYSIS_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const response = result.response;
  const text = response.text();

  /* Parse JSON response */
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return createFallbackDescription(index);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    index,
    description: parsed.description || "No description available",
    mood: parsed.mood,
    subjects: parsed.subjects,
    dominantColors: parsed.dominantColors,
  };
}

/**
 * Creates a fallback description when analysis fails.
 */
function createFallbackDescription(index: number): ImageDescription {
  return {
    index,
    description: `Image ${index + 1}`,
    mood: undefined,
    subjects: [],
    dominantColors: [],
  };
}

/**
 * Converts a File to base64 string (without data URL prefix).
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      /* Remove the data URL prefix (e.g., "data:image/png;base64,") */
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
