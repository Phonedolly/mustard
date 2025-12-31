"use client";

/**
 * ViralContentPanel Component
 *
 * Generates and displays SNS-optimized content including:
 * - Description text with emojis and engagement hooks
 * - Hashtags for discoverability
 *
 * Features copy-to-clipboard functionality for easy sharing.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
  Hash,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface ViralContentPanelProps {
  storyContent: string;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function ViralContentPanel({
  storyContent,
  className,
}: ViralContentPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [copiedDescription, setCopiedDescription] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  /* ───────────────────────────────────────────────────────────────────────────
   * Generate Viral Content
   * ─────────────────────────────────────────────────────────────────────────── */

  const generateContent = useCallback(async () => {
    if (!storyContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-viral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate viral content");

      const data = await response.json();
      setDescription(data.description);
      setHashtags(data.hashtags);
    } catch (error) {
      console.error("[ViralContentPanel] Generation error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [storyContent]);

  /* ───────────────────────────────────────────────────────────────────────────
   * Copy Functions
   * ─────────────────────────────────────────────────────────────────────────── */

  const copyToClipboard = useCallback(
    async (text: string, type: "description" | "hashtags" | "all") => {
      try {
        await navigator.clipboard.writeText(text);

        if (type === "description") {
          setCopiedDescription(true);
          setTimeout(() => setCopiedDescription(false), 2000);
        } else if (type === "hashtags") {
          setCopiedHashtags(true);
          setTimeout(() => setCopiedHashtags(false), 2000);
        } else {
          setCopiedAll(true);
          setTimeout(() => setCopiedAll(false), 2000);
        }
      } catch (error) {
        console.error("[ViralContentPanel] Copy error:", error);
      }
    },
    []
  );

  const copyAll = useCallback(() => {
    const fullContent = `${description}\n\n${hashtags}`;
    copyToClipboard(fullContent, "all");
  }, [description, hashtags, copyToClipboard]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <Card>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="h-4 w-4" />
                SNS Export
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Generate Button */}
            {!description && !hashtags && (
              <Button
                onClick={generateContent}
                disabled={isLoading || !storyContent.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Generate SNS Content
              </Button>
            )}

            {/* Description Section */}
            {(description || isLoading) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Description
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(description, "description")}
                      disabled={!description}
                    >
                      {copiedDescription ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={generateContent}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isLoading ? "Generating..." : "SNS description will appear here"}
                  className="min-h-[100px] text-sm"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Hashtags Section */}
            {(hashtags || isLoading) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(hashtags, "hashtags")}
                    disabled={!hashtags}
                  >
                    {copiedHashtags ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <Textarea
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder={isLoading ? "Generating..." : "Hashtags will appear here"}
                  className="min-h-[60px] text-sm"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Copy All Button */}
            {description && hashtags && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={copyAll}
                >
                  {copiedAll ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy All
                </Button>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default ViralContentPanel;
