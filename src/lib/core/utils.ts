/* Utility functions extracted from yt-shorts-generator-3 */

/**
 * Decodes a base64-encoded prompt that was split into chunks.
 * The original codebase uses this simple obfuscation to store prompts.
 *
 * Note: This approach provides minimal security - it's essentially just
 * encoding, not encryption. For production, consider proper secrets management.
 */
export const decodePrompt = (base64EncodedPrompt: string[]): string => {
  /* Join all chunks and decode from base64 */
  const binaryStr = atob(base64EncodedPrompt.join(""));

  /* Convert binary string to Uint8Array for proper UTF-8 handling */
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  /* Decode as UTF-8 to handle Korean characters correctly */
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
};

/**
 * Generates a unique ID using nanoid pattern.
 * For simplicity, we use a random string generator here.
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
