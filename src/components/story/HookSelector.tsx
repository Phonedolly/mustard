"use client";

/**
 * HookSelector Component
 *
 * A modal dialog that displays multiple HOOK variations for selection.
 * Users can preview different hook styles and choose the one that best fits their content.
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
import type { HookType } from "@/lib/duyo/types";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface HookSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hooks: Record<string, string>;
  selectedHook: string | null;
  onSelect: (hookType: string, hookContent: string) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Hook Type Metadata
 * ───────────────────────────────────────────────────────────────────────────── */

const HOOK_TYPE_INFO: Record<string, { emoji: string; description: string }> = {
  "질문형": {
    emoji: "?",
    description: "시청자에게 질문을 던져 호기심 유발",
  },
  "충격 사실형": {
    emoji: "!",
    description: "놀라운 사실로 주의를 끌기",
  },
  "대비형": {
    emoji: "VS",
    description: "A vs B 형식으로 반전 예고",
  },
  "스토리 티저형": {
    emoji: "...",
    description: "스토리의 일부만 공개해 궁금증 유발",
  },
  "통계 강조형": {
    emoji: "%",
    description: "숫자와 통계로 신뢰성 부여",
  },
  "행동 유도형": {
    emoji: ">",
    description: "즉각적인 행동 촉구",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function HookSelector({
  open,
  onOpenChange,
  hooks,
  selectedHook,
  onSelect,
  onRegenerate,
  isLoading = false,
}: HookSelectorProps) {
  const [tempSelection, setTempSelection] = useState<{
    type: string;
    content: string;
  } | null>(null);

  const hookEntries = Object.entries(hooks);

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
            <DialogTitle className="text-xl">HOOK Select</DialogTitle>
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
            <span className="ml-3 text-muted-foreground">Generating hooks...</span>
          </div>
        ) : hookEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hooks available. Click regenerate to generate new hooks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {hookEntries.map(([type, content]) => {
              const info = HOOK_TYPE_INFO[type] || { emoji: "H", description: type };
              const isSelected = tempSelection?.type === type ||
                (tempSelection === null && selectedHook === content);

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
            disabled={!tempSelection && !selectedHook}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HookSelector;
