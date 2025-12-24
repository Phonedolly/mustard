/* API Route: Split Story into Scenes via yumeta.kr Proxy */

import { NextRequest, NextResponse } from "next/server";
import { parseSplitSceneContent } from "@/lib/core/parseScript";
import type { SplitSceneResponse, Phrase } from "@/lib/core/types";

const SPLIT_SCENE_API_URL = "https://yumeta.kr/duyo_api/split_scene.php";

/*
 * POST /api/split-scenes
 *
 * Proxies the split_scene API from yumeta.kr and parses the response
 * into structured Phrases with Statements.
 *
 * Request body:
 * - story: string (raw story text to split)
 *
 * Response:
 * - phrases: Phrase[] (structured scene data)
 * - raw: string (raw content from upstream API)
 * - usage: { prompt_tokens, completion_tokens }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { story } = body;

    if (!story || typeof story !== "string" || story.trim().length === 0) {
      return NextResponse.json(
        { error: "story is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    /*
     * Call the upstream split_scene API.
     *
     * Request: { _openrouter_key, story }
     * Response: { success, content, usage, model, token_info }
     *
     * Content format:
     * "scene 1\n첫번째 문장\n두번째 문장\n\nscene 2\n다음 문장\n..."
     */
    const upstreamResponse = await fetch(SPLIT_SCENE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _openrouter_key: openRouterKey,
        story: story.trim(),
      }),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error("Upstream API error:", errorText);
      return NextResponse.json(
        { error: `Upstream API returned ${upstreamResponse.status}` },
        { status: 502 }
      );
    }

    const upstreamData: SplitSceneResponse = await upstreamResponse.json();

    if (!upstreamData.success) {
      return NextResponse.json(
        { error: "Upstream API returned success: false" },
        { status: 502 }
      );
    }

    /* Log raw API response for debugging */
    console.log("=== yumeta API raw response ===");
    console.log("Content length:", upstreamData.content.length);
    console.log("First 1000 chars:", upstreamData.content.slice(0, 1000));
    console.log("Double newline count:", (upstreamData.content.match(/\n\n/g) || []).length);
    console.log("Scene header count:", (upstreamData.content.match(/scene \d+/gi) || []).length);
    console.log("================================");

    const phrases: Phrase[] = parseSplitSceneContent(upstreamData.content);

    console.log("Parsed phrases count:", phrases.length);
    console.log("Total statements:", phrases.reduce((sum, p) => sum + p.statements.length, 0));

    return NextResponse.json({
      phrases,
      raw: upstreamData.content,
      usage: upstreamData.usage,
      model: upstreamData.model,
    });
  } catch (error) {
    console.error("split-scenes API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
