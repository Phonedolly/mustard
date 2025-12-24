/* Image analysis using Gemini Vision */

import { getVisionModel } from "./client";
import { IMAGE_ANALYSIS_PROMPT } from "./prompts/imagePlacement";
import type { ImageDescription } from "@/lib/core/types";

/**
 * Analyzes images and extracts descriptions for placement purposes.
 *
 * Gemini 3.0 Flash supports multimodal input, allowing us to send
 * images along with text prompts for analysis.
 */
export async function analyzeImages(
  imageFiles: File[],
  apiKey: string
): Promise<ImageDescription[]> {
  const model = getVisionModel(apiKey);
  const descriptions: ImageDescription[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const description = await analyzeImage(file, i, model);
    descriptions.push(description);
  }

  return descriptions;
}

/**
 * Analyzes a single image and returns structured description.
 */
async function analyzeImage(
  file: File,
  index: number,
  model: ReturnType<typeof getVisionModel>
): Promise<ImageDescription> {
  try {
    /* Convert file to base64 for Gemini API */
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || "image/jpeg";

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
  } catch (error) {
    console.error(`Failed to analyze image ${index}:`, error);
    return createFallbackDescription(index);
  }
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

/**
 * Analyzes images from base64 strings (for server-side usage).
 */
export async function analyzeImagesFromBase64(
  images: Array<{ data: string; mimeType: string }>,
  apiKey: string
): Promise<ImageDescription[]> {
  const model = getVisionModel(apiKey);
  const descriptions: ImageDescription[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.data,
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        descriptions.push({
          index: i,
          description: parsed.description || `Image ${i + 1}`,
          mood: parsed.mood,
          subjects: parsed.subjects,
          dominantColors: parsed.dominantColors,
        });
      } else {
        descriptions.push(createFallbackDescription(i));
      }
    } catch (error) {
      console.error(`Failed to analyze image ${i}:`, error);
      descriptions.push(createFallbackDescription(i));
    }
  }

  return descriptions;
}
