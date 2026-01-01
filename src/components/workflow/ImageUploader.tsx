"use client";

/* ImageUploader - Multi-image upload with preview and base64 conversion */

import { useState, useCallback, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

/*
 * Image compression options.
 * Compresses images before upload to stay within Vercel's body size limit.
 * Even with Pro plan (50MB limit), compression improves upload speed and API performance.
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUploader({
  onImagesChange,
  maxImages = 50,
  maxSizeMB = 10,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /*
   * Convert File to base64 string (without data URL prefix).
   * This format is required by the Gemini Vision API.
   */
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        /* Remove data URL prefix: "data:image/png;base64," */
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      /* Check total count */
      if (images.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      setIsCompressing(true);
      const newImages: UploadedImage[] = [];

      for (const file of fileArray) {
        /* Validate type */
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError(`Invalid file type: ${file.name}. Use JPEG, PNG, WebP, or GIF.`);
          continue;
        }

        /* Validate size */
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          setError(`File too large: ${file.name}. Maximum ${maxSizeMB}MB.`);
          continue;
        }

        try {
          /*
           * Compress image before processing.
           * This reduces payload size for Vercel's body limit and improves upload speed.
           * Original file is preserved for preview, compressed version for API upload.
           */
          console.log(`[ImageUploader] Compressing ${file.name} (${sizeMB.toFixed(2)}MB)...`);
          const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
          const compressedSizeMB = compressedFile.size / (1024 * 1024);
          console.log(`[ImageUploader] Compressed to ${compressedSizeMB.toFixed(2)}MB`);

          const base64 = await fileToBase64(compressedFile);
          const preview = URL.createObjectURL(file);

          newImages.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file: compressedFile,
            preview,
            base64,
            mimeType: compressedFile.type,
          });
        } catch (err) {
          console.error(`[ImageUploader] Failed to process ${file.name}:`, err);
          setError(`Failed to process: ${file.name}`);
        }
      }

      setIsCompressing(false);

      if (newImages.length > 0) {
        const updated = [...images, ...newImages];
        setImages(updated);
        onImagesChange(updated);
      }
    },
    [images, maxImages, maxSizeMB, fileToBase64, onImagesChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
      }
      /* Reset input so same file can be selected again */
      e.target.value = "";
    },
    [processFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      const updated = images.filter((img) => img.id !== id);
      setImages(updated);
      onImagesChange(updated);
      setError(null);
    },
    [images, onImagesChange]
  );

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    onImagesChange([]);
    setError(null);
  }, [images, onImagesChange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upload Images</CardTitle>
        <Badge variant="outline">
          {images.length} / {maxImages}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => images.length < maxImages && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={images.length >= maxImages}
          />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isCompressing
                ? "Compressing images..."
                : isDragging
                  ? "Drop images here..."
                  : "Click or drag images to upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, GIF (auto-compressed to ~1MB)
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Image Previews */}
        {images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploaded Images</span>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square rounded-md overflow-hidden border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Index Badge */}
                    <Badge
                      className="absolute top-1 left-1 text-xs"
                      variant="secondary"
                    >
                      {index + 1}
                    </Badge>
                    {/* Remove Button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                    >
                      X
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
