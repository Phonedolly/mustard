"use client";

/* PhraseTree - Hierarchical view of Phrases (Scenes) and Statements */

/*
 * Terminology:
 * - Phrase = Scene (e.g., "scene 6" - a logical unit containing multiple lines)
 * - Statement = Individual line within a scene (dialogue, narration, etc.)
 *
 * UI Design:
 * - Always show all statements (no expand/collapse)
 * - Clear visual hierarchy: Scene header > Statement list
 * - Consistent with PlacementVisualizer layout
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Phrase, ImagePlacement } from "@/lib/core/types";

interface PhraseTreeProps {
  phrases: Phrase[];
  placements?: ImagePlacement[];
  onPhraseSelect?: (phraseIndex: number) => void;
  onStatementSelect?: (phraseIndex: number, statementIndex: number) => void;
  selectedPhraseIndex?: number;
}

export function PhraseTree({
  phrases,
  placements = [],
  onPhraseSelect,
  onStatementSelect,
  selectedPhraseIndex,
}: PhraseTreeProps) {
  /*
   * Find placements for a specific phrase.
   */
  const getPhrasePlacements = (phraseIndex: number) => {
    return placements.filter((p) => p.phraseIndex === phraseIndex);
  };

  /*
   * Check if a statement has an image placement.
   */
  const hasStatementPlacement = (
    phraseIndex: number,
    statementIndex: number
  ) => {
    return placements.some(
      (p) =>
        p.phraseIndex === phraseIndex &&
        p.type === "statement" &&
        p.statementIndices?.includes(statementIndex)
    );
  };

  if (phrases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scene Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No scenes available. Generate a story and split it into scenes first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scene Structure</CardTitle>
        <Badge variant="outline">{phrases.length} scenes</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {phrases.map((phrase, phraseIndex) => {
            const isSelected = selectedPhraseIndex === phraseIndex;
            const phrasePlacements = getPhrasePlacements(phraseIndex);

            return (
              <div
                key={phrase.id}
                className={`
                  border rounded-lg overflow-hidden
                  ${isSelected ? "ring-2 ring-primary" : ""}
                `}
              >
                {/* Phrase (Scene) Header */}
                <div
                  className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-pointer hover:bg-muted/70"
                  onClick={() => onPhraseSelect?.(phraseIndex)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Scene {phraseIndex + 1}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {phrase.statements.length} statements
                    </span>
                  </div>

                  {/* Image Placement Indicators */}
                  {phrasePlacements.length > 0 && (
                    <div className="flex gap-1">
                      {phrasePlacements.map((p) => (
                        <Badge
                          key={p.imageIndex}
                          variant="secondary"
                          className="text-xs"
                        >
                          IMG {p.imageIndex + 1}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Statements List - Always visible */}
                <div className="divide-y">
                  {phrase.statements.map((statement, statementIndex) => {
                    const hasImage = hasStatementPlacement(
                      phraseIndex,
                      statementIndex
                    );

                    return (
                      <div
                        key={statement.id}
                        className={`
                          flex items-start gap-3 px-3 py-2 cursor-pointer
                          hover:bg-muted/30 transition-colors
                          ${hasImage ? "bg-primary/5" : ""}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatementSelect?.(phraseIndex, statementIndex);
                        }}
                      >
                        {/* Statement Index */}
                        <span className="text-xs text-muted-foreground/60 w-6 flex-shrink-0 pt-0.5 text-right">
                          {statementIndex + 1}.
                        </span>

                        {/* Statement Text */}
                        <p className="text-sm text-foreground flex-1">
                          {statement.displayText}
                        </p>

                        {/* Image Indicator */}
                        {hasImage && (
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            IMG
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <Separator className="my-4" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Total: {phrases.reduce((sum, p) => sum + p.statements.length, 0)}{" "}
            statements across {phrases.length} scenes
          </span>
          {placements.length > 0 && (
            <span>{placements.length} images placed</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
