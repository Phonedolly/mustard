"use client";

/* Main Page - Image Placement PoC Workflow */

import { useState, useCallback } from "react";
import {
  KeywordForm,
  ImageUploader,
  StoryDisplay,
  PhraseTree,
  WorkflowStepper,
  PlacementVisualizer,
  useWorkflowState,
  type UploadedImage,
} from "@/components/workflow";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SelectedKeywords, Phrase, ImagePlacement, ImageDescription } from "@/lib/core/types";

export default function Home() {
  /* Workflow State */
  const {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
  } = useWorkflowState("keywords");

  /* Data State */
  const [story, setStory] = useState("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<ImageDescription[]>([]);
  const [placements, setPlacements] = useState<ImagePlacement[]>([]);

  /* Loading States */
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  /* Error State */
  const [error, setError] = useState<string | null>(null);

  /* Step 1: Generate Story */
  const handleGenerateStory = useCallback(async (keywords: SelectedKeywords) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate story");
      }

      setStory(data.story);
      completeStep("keywords");
      goToStep("story");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  }, [completeStep, goToStep]);

  /* Step 2: Split into Scenes */
  const handleSplitScenes = useCallback(async () => {
    if (!story) return;

    setIsSplitting(true);
    setError(null);

    try {
      const response = await fetch("/api/split-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to split scenes");
      }

      setPhrases(data.phrases);
      completeStep("story");
      goToStep("images");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSplitting(false);
    }
  }, [story, completeStep, goToStep]);

  /* Step 3: Handle Image Upload */
  const handleImagesChange = useCallback((uploadedImages: UploadedImage[]) => {
    setImages(uploadedImages);
  }, []);

  /* Step 3: Analyze Images and Place */
  const handleAnalyzeAndPlace = useCallback(async () => {
    if (images.length === 0 || phrases.length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      /* Analyze images */
      const analyzeResponse = await fetch("/api/analyze-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((img) => ({
            data: img.base64,
            mimeType: img.mimeType,
          })),
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok) {
        throw new Error(analyzeData.error || "Failed to analyze images");
      }

      setImageDescriptions(analyzeData.descriptions);
      completeStep("images");

      /* Place images */
      setIsAnalyzing(false);
      setIsPlacing(true);

      const placeResponse = await fetch("/api/place-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrases,
          imageDescriptions: analyzeData.descriptions,
        }),
      });

      const placeData = await placeResponse.json();

      if (!placeResponse.ok) {
        throw new Error(placeData.error || "Failed to place images");
      }

      setPlacements(placeData.placements);
      goToStep("placement");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsAnalyzing(false);
      setIsPlacing(false);
    }
  }, [images, phrases, completeStep, goToStep]);

  /* Handle Placement Changes (manual drag-drop) */
  const handlePlacementChange = useCallback((newPlacements: ImagePlacement[]) => {
    setPlacements(newPlacements);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto px-4 py-4 max-w-[1280px]">
          <h1 className="text-2xl font-bold">Image Placement PoC</h1>
          <p className="text-sm text-muted-foreground">
            Generate stories and place images on scenes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-4 py-6 space-y-6 max-w-[1280px]">
        {/* Workflow Stepper */}
        <WorkflowStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
            <p className="text-sm font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Step Content */}
        <Tabs value={currentStep} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="keywords" onClick={() => goToStep("keywords")}>
              Keywords
            </TabsTrigger>
            <TabsTrigger
              value="story"
              onClick={() => goToStep("story")}
              disabled={!story}
            >
              Story
            </TabsTrigger>
            <TabsTrigger
              value="images"
              onClick={() => goToStep("images")}
              disabled={phrases.length === 0}
            >
              Images
            </TabsTrigger>
            <TabsTrigger
              value="placement"
              onClick={() => goToStep("placement")}
              disabled={placements.length === 0}
            >
              Placement
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Keywords */}
          <TabsContent value="keywords">
            <KeywordForm onSubmit={handleGenerateStory} isLoading={isGenerating} />
          </TabsContent>

          {/* Step 2: Story */}
          <TabsContent value="story" className="space-y-6">
            <StoryDisplay
              story={story}
              onStoryChange={setStory}
              onSplitScenes={handleSplitScenes}
              isLoading={isSplitting}
            />
            {phrases.length > 0 && (
              <PhraseTree phrases={phrases} placements={placements} />
            )}
          </TabsContent>

          {/* Step 3: Images */}
          <TabsContent value="images" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImageUploader onImagesChange={handleImagesChange} />
              <PhraseTree phrases={phrases} placements={placements} />
            </div>
            <Button
              className="w-full"
              onClick={handleAnalyzeAndPlace}
              disabled={images.length === 0 || isAnalyzing || isPlacing}
            >
              {isAnalyzing
                ? "Analyzing Images..."
                : isPlacing
                  ? "Placing Images..."
                  : "Analyze & Place Images"}
            </Button>
          </TabsContent>

          {/* Step 4: Placement */}
          <TabsContent value="placement" className="space-y-6">
            <PlacementVisualizer
              phrases={phrases}
              placements={placements}
              images={images}
              imageDescriptions={imageDescriptions}
              onPlacementChange={handlePlacementChange}
            />

            {/* Export / Summary Section */}
            <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Placement Complete</p>
                <p className="text-sm text-muted-foreground">
                  {placements.length} images placed across {phrases.length} scenes
                </p>
              </div>
              <Button
                onClick={() => {
                  /* Export placement data as JSON */
                  const exportData = {
                    phrases,
                    placements,
                    imageDescriptions,
                  };
                  const blob = new Blob(
                    [JSON.stringify(exportData, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "placement-data.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
