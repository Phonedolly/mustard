"use client";

/* StoryDisplay - Shows generated story with copy and edit capabilities */

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StoryDisplayProps {
  story: string;
  onStoryChange?: (story: string) => void;
  onSplitScenes?: () => void;
  isLoading?: boolean;
  editable?: boolean;
}

export function StoryDisplay({
  story,
  onStoryChange,
  onSplitScenes,
  isLoading = false,
  editable = true,
}: StoryDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState(story);
  const [copied, setCopied] = useState(false);

  /*
   * Count characters and estimate reading time.
   * Korean text reads at approximately 200-300 characters per minute.
   */
  const charCount = story.length;
  const wordCount = story.split(/\s+/).filter(Boolean).length;
  const readingTimeMin = Math.ceil(charCount / 250);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(story);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Fallback for older browsers */
      const textarea = document.createElement("textarea");
      textarea.value = story;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [story]);

  const handleEdit = useCallback(() => {
    setEditedStory(story);
    setIsEditing(true);
  }, [story]);

  const handleSave = useCallback(() => {
    onStoryChange?.(editedStory);
    setIsEditing(false);
  }, [editedStory, onStoryChange]);

  const handleCancel = useCallback(() => {
    setEditedStory(story);
    setIsEditing(false);
  }, [story]);

  if (!story) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generated Story</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No story generated yet. Fill in the keywords and click "Generate Story".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Generated Story</CardTitle>
          <Badge variant="outline">{charCount} chars</Badge>
          <Badge variant="outline">~{readingTimeMin} min read</Badge>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
              {editable && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-4">
            <Textarea
              value={editedStory}
              onChange={(e) => setEditedStory(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <ScrollArea className="h-[400px]">
            <div className="pr-4">
              {/*
               * Render story with paragraph breaks preserved.
               * Double newlines indicate paragraph boundaries.
               */}
              {story.split("\n\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-4 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Split Scenes Button */}
        {!isEditing && onSplitScenes && (
          <Button
            onClick={onSplitScenes}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Splitting Scenes..." : "Split into Scenes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
