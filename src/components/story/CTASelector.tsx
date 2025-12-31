"use client";

/**
 * CTASelector Component
 *
 * A modal dialog that displays multiple CTA (Call-To-Action) variations for selection.
 * Users can preview different CTA styles and choose the one that best fits their content.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface CTASelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctas: Record<string, string>;
  selectedCTA: string | null;
  onSelect: (ctaType: string, ctaContent: string) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CTA Type Metadata
 * ───────────────────────────────────────────────────────────────────────────── */

const CTA_TYPE_INFO: Record<string, { emoji: string; description: string }> = {
  "참여 유도형": {
    emoji: "C",
    description: "댓글, 공감 등 참여를 유도",
  },
  "구독/팔로우 유형": {
    emoji: "+",
    description: "채널 구독/팔로우 요청",
  },
  "확장 시청 유도형": {
    emoji: ">",
    description: "다음 영상이나 시리즈 시청 유도",
  },
  "행동 전환형": {
    emoji: "O",
    description: "링크 클릭, 구매 등 전환 행동",
  },
  "즉각 행동 촉구형": {
    emoji: "!",
    description: "지금 바로 행동하도록 촉구",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function CTASelector({
  open,
  onOpenChange,
  ctas,
  selectedCTA,
  onSelect,
  onRegenerate,
  isLoading = false,
}: CTASelectorProps) {
  const [tempSelection, setTempSelection] = useState<{
    type: string;
    content: string;
  } | null>(null);

  const ctaEntries = Object.entries(ctas);

  const handleConfirm = () => {
    if (tempSelection) {
      onSelect(tempSelection.type, tempSelection.content);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setTempSelection(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">CTA Select</DialogTitle>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Generating CTAs...</span>
          </div>
        ) : ctaEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No CTAs available. Click regenerate to generate new CTAs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {ctaEntries.map(([type, content]) => {
              const info = CTA_TYPE_INFO[type] || { emoji: "C", description: type };
              const isSelected = tempSelection?.type === type ||
                (tempSelection === null && selectedCTA === content);

              return (
                <Card
                  key={type}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => setTempSelection({ type, content })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="font-mono">
                        {info.emoji}
                      </Badge>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{type}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {info.description}
                    </p>
                    <div className="text-sm bg-muted p-3 rounded-md min-h-[60px]">
                      {content}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!tempSelection && !selectedCTA}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CTASelector;
