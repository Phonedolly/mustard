"use client";

/* KeywordForm - Story generation keyword configuration form */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  genreOptions,
  moodOptions,
  endingStyleOptions,
  mainCharacterGenderOptions,
  mainCharacterAgeOptions,
  toneOptions,
  ratingOptions,
  lengthOptions,
} from "@/lib/core/keywords";
import type { SelectedKeywords } from "@/lib/core/types";

interface KeywordFormProps {
  onSubmit: (keywords: SelectedKeywords) => void;
  isLoading?: boolean;
}

/*
 * Default values following yt-shorts-generator-3 conventions.
 * Most options default to "auto" to let the AI decide.
 */
const defaultKeywords: SelectedKeywords = {
  topic: "",
  genre: "auto",
  mood: "auto",
  endingStyle: "auto",
  mainCharacter: {
    gender: "auto",
    age: "auto",
  },
  tone: "auto",
  length: "medium",
  rating: "medium",
  characterLimit: false,
  multiEnding: false,
  finishWithQuestion: false,
};

export function KeywordForm({ onSubmit, isLoading = false }: KeywordFormProps) {
  const [keywords, setKeywords] = useState<SelectedKeywords>(defaultKeywords);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.topic.trim()) return;
    onSubmit(keywords);
  };

  const updateKeyword = <K extends keyof SelectedKeywords>(
    key: K,
    value: SelectedKeywords[K]
  ) => {
    setKeywords((prev) => ({ ...prev, [key]: value }));
  };

  const updateMainCharacter = (
    key: keyof SelectedKeywords["mainCharacter"],
    value: string
  ) => {
    setKeywords((prev) => ({
      ...prev,
      mainCharacter: {
        ...prev.mainCharacter,
        [key]: value as SelectedKeywords["mainCharacter"][typeof key],
      },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Keywords</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic - Required */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Textarea
              id="topic"
              placeholder="Enter your story topic or idea..."
              value={keywords.topic}
              onChange={(e) => updateKeyword("topic", e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Genre Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select
                value={keywords.genre}
                onValueChange={(v) =>
                  updateKeyword("genre", v as SelectedKeywords["genre"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(genreOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Genre Input */}
            {keywords.genre === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customGenre">Custom Genre</Label>
                <Input
                  id="customGenre"
                  placeholder="Enter custom genre..."
                  value={keywords.customGenre || ""}
                  onChange={(e) => updateKeyword("customGenre", e.target.value)}
                />
              </div>
            )}

            {/* Mood */}
            <div className="space-y-2">
              <Label>Mood</Label>
              <Select
                value={keywords.mood}
                onValueChange={(v) =>
                  updateKeyword("mood", v as SelectedKeywords["mood"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(moodOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ending Style & Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ending Style</Label>
              <Select
                value={keywords.endingStyle}
                onValueChange={(v) =>
                  updateKeyword(
                    "endingStyle",
                    v as SelectedKeywords["endingStyle"]
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(endingStyleOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={keywords.tone}
                onValueChange={(v) =>
                  updateKeyword("tone", v as SelectedKeywords["tone"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(toneOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Character */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Character Gender</Label>
              <Select
                value={keywords.mainCharacter.gender}
                onValueChange={(v) => updateMainCharacter("gender", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mainCharacterGenderOptions).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Character Age</Label>
              <Select
                value={keywords.mainCharacter.age}
                onValueChange={(v) => updateMainCharacter("age", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(mainCharacterAgeOptions).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Length & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Length</Label>
              <Select
                value={keywords.length}
                onValueChange={(v) =>
                  updateKeyword("length", v as SelectedKeywords["length"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(lengthOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <Select
                value={keywords.rating}
                onValueChange={(v) =>
                  updateKeyword("rating", v as SelectedKeywords["rating"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ratingOptions).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Boolean Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="characterLimit"
                checked={keywords.characterLimit}
                onCheckedChange={(checked) =>
                  updateKeyword("characterLimit", checked === true)
                }
              />
              <Label htmlFor="characterLimit" className="cursor-pointer">
                Character limit (shorter sentences)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiEnding"
                checked={keywords.multiEnding}
                onCheckedChange={(checked) =>
                  updateKeyword("multiEnding", checked === true)
                }
              />
              <Label htmlFor="multiEnding" className="cursor-pointer">
                Multiple endings (A/B choice)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="finishWithQuestion"
                checked={keywords.finishWithQuestion}
                onCheckedChange={(checked) =>
                  updateKeyword("finishWithQuestion", checked === true)
                }
              />
              <Label htmlFor="finishWithQuestion" className="cursor-pointer">
                End with a question
              </Label>
            </div>
          </div>

          {/* Additional Request */}
          <div className="space-y-2">
            <Label htmlFor="additionalRequest">Additional Request</Label>
            <Textarea
              id="additionalRequest"
              placeholder="Any additional requirements or style notes..."
              value={keywords.additionalRequest || ""}
              onChange={(e) =>
                updateKeyword("additionalRequest", e.target.value)
              }
              className="min-h-[60px]"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !keywords.topic.trim()}
          >
            {isLoading ? "Generating..." : "Generate Story"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
