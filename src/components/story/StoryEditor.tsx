"use client";

/**
 * StoryEditor Component
 *
 * The main story editing interface with HOOK/BODY/CTA structure.
 * Features:
 * - Split-pane layout with AI assistant on the right
 * - HOOK and CTA generation/selection modals
 * - Editable text areas for each section
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Anchor,
  FileText,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { HookSelector } from "./HookSelector";
import { CTASelector } from "./CTASelector";
import { AIAssistant } from "./AIAssistant";

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

interface StoryEditorProps {
  story: string;
  hook: string | null;
  body: string;
  cta: string | null;
  onHookChange: (hook: string | null) => void;
  onBodyChange: (body: string) => void;
  onCTAChange: (cta: string | null) => void;
  onSplitScenes?: () => void;
  isSplitting?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Component
 * ───────────────────────────────────────────────────────────────────────────── */

export function StoryEditor({
  story,
  hook,
  body,
  cta,
  onHookChange,
  onBodyChange,
  onCTAChange,
  onSplitScenes,
  isSplitting = false,
}: StoryEditorProps) {
  /* Section collapse states */
  const [hookOpen, setHookOpen] = useState(true);
  const [bodyOpen, setBodyOpen] = useState(true);
  const [ctaOpen, setCtaOpen] = useState(true);

  /* Modal states */
  const [hookSelectorOpen, setHookSelectorOpen] = useState(false);
  const [ctaSelectorOpen, setCTASelectorOpen] = useState(false);

  /* Generated options */
  const [generatedHooks, setGeneratedHooks] = useState<Record<string, string>>({});
  const [generatedCTAs, setGeneratedCTAs] = useState<Record<string, string>>({});

  /* Loading states */
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [isGeneratingCTAs, setIsGeneratingCTAs] = useState(false);

  /* ───────────────────────────────────────────────────────────────────────────
   * HOOK Generation
   * ─────────────────────────────────────────────────────────────────────────── */

  const generateHooks = useCallback(async () => {
    setIsGeneratingHooks(true);
    try {
      const response = await fetch("/api/generate-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyContent: body || story,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate hooks");

      const data = await response.json();
      setGeneratedHooks(data.hooks);
      setHookSelectorOpen(true);
    } catch (error) {
      console.error("[StoryEditor] Hook generation error:", error);
    } finally {
      setIsGeneratingHooks(false);
    }
  }, [body, story]);

  const handleHookSelect = useCallback(
    (type: string, content: string) => {
      onHookChange(content);
    },
    [onHookChange]
  );

  /* ───────────────────────────────────────────────────────────────────────────
   * CTA Generation
   * ─────────────────────────────────────────────────────────────────────────── */

  const generateCTAs = useCallback(async () => {
    setIsGeneratingCTAs(true);
    try {
      const response = await fetch("/api/generate-cta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyContent: body || story,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate CTAs");

      const data = await response.json();
      setGeneratedCTAs(data.ctas);
      setCTASelectorOpen(true);
    } catch (error) {
      console.error("[StoryEditor] CTA generation error:", error);
    } finally {
      setIsGeneratingCTAs(false);
    }
  }, [body, story]);

  const handleCTASelect = useCallback(
    (type: string, content: string) => {
      onCTAChange(content);
    },
    [onCTAChange]
  );

  /* ───────────────────────────────────────────────────────────────────────────
   * AI Assistant Content Update
   * ─────────────────────────────────────────────────────────────────────────── */

  const handleAIContentUpdate = useCallback(
    (updates: { hook?: string; body?: string; cta?: string }) => {
      if (updates.hook !== undefined) onHookChange(updates.hook);
      if (updates.body !== undefined) onBodyChange(updates.body);
      if (updates.cta !== undefined) onCTAChange(updates.cta);
    },
    [onHookChange, onBodyChange, onCTAChange]
  );

  return (
    <div className="relative">
      {/* Content Editor - with right margin for floating chat */}
      <div className="flex flex-col gap-4 mr-[420px]">
        {/* HOOK Section */}
        <Collapsible open={hookOpen} onOpenChange={setHookOpen}>
          <Card>
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Anchor className="h-4 w-4" />
                    HOOK
                    <Badge variant="secondary" className="ml-2">
                      First 3 seconds
                    </Badge>
                  </CardTitle>
                  {hookOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Textarea
                  value={hook || ""}
                  onChange={(e) => onHookChange(e.target.value || null)}
                  placeholder="Enter hook content or generate..."
                  className="min-h-[80px] mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateHooks}
                    disabled={isGeneratingHooks}
                  >
                    {isGeneratingHooks ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Generate HOOK
                  </Button>
                  {Object.keys(generatedHooks).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHookSelectorOpen(true)}
                    >
                      View Options
                    </Button>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* BODY Section */}
        <Collapsible open={bodyOpen} onOpenChange={setBodyOpen}>
          <Card className="flex-1">
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    BODY
                    <Badge variant="secondary" className="ml-2">
                      Main Story
                    </Badge>
                  </CardTitle>
                  {bodyOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Textarea
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                  placeholder="Story content..."
                  className="min-h-[200px] mb-3 font-mono text-sm"
                />
                {onSplitScenes && (
                  <Button
                    onClick={onSplitScenes}
                    disabled={isSplitting || !body.trim()}
                  >
                    {isSplitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Split Scenes
                  </Button>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* CTA Section */}
        <Collapsible open={ctaOpen} onOpenChange={setCtaOpen}>
          <Card>
            <CardHeader className="py-3">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-4 w-4" />
                    CTA
                    <Badge variant="secondary" className="ml-2">
                      Call To Action
                    </Badge>
                  </CardTitle>
                  {ctaOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Textarea
                  value={cta || ""}
                  onChange={(e) => onCTAChange(e.target.value || null)}
                  placeholder="Enter CTA content or generate..."
                  className="min-h-[80px] mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCTAs}
                    disabled={isGeneratingCTAs}
                  >
                    {isGeneratingCTAs ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Generate CTA
                  </Button>
                  {Object.keys(generatedCTAs).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCTASelectorOpen(true)}
                    >
                      View Options
                    </Button>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Floating AI Chat Window - Always visible, positioned below step navigation */}
      <div className="fixed top-[160px] bottom-6 right-6 z-40 w-[400px] bg-background border rounded-lg shadow-lg">
        {/* Chat Header */}
        <div className="flex items-center px-4 py-2 border-b bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
        </div>

        {/* Chat Content */}
        <div className="h-[calc(100%-44px)]">
          <AIAssistant
            hookContent={hook || ""}
            bodyContent={body}
            ctaContent={cta || ""}
            onContentUpdate={handleAIContentUpdate}
            className="h-full"
          />
        </div>
      </div>

      {/* Modals */}
      <HookSelector
        open={hookSelectorOpen}
        onOpenChange={setHookSelectorOpen}
        hooks={generatedHooks}
        selectedHook={hook}
        onSelect={handleHookSelect}
        onRegenerate={generateHooks}
        isLoading={isGeneratingHooks}
      />

      <CTASelector
        open={ctaSelectorOpen}
        onOpenChange={setCTASelectorOpen}
        ctas={generatedCTAs}
        selectedCTA={cta}
        onSelect={handleCTASelect}
        onRegenerate={generateCTAs}
        isLoading={isGeneratingCTAs}
      />
    </div>
  );
}

export default StoryEditor;
