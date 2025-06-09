"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ImageIcon, Palette, AlertTriangle } from "lucide-react";
import Image from "next/image";
import {
  convertToGrayscale,
  resizeImage,
  ensureImageLoaded,
} from "@/lib/image-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImagePreviewProps {
  originalImage: string;
  imageRef: React.RefObject<HTMLImageElement | null>;
  colorMode: "rgb" | "grayscale";
  onImageProcessed?: (processedImage: string) => void;
}

export function ImagePreview({
  originalImage,
  imageRef,
  colorMode,
  onImageProcessed,
}: ImagePreviewProps) {
  const [grayscaleImage, setGrayscaleImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [showGrayscale, setShowGrayscale] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);

  useEffect(() => {
    const processImage = async () => {
      if (!imageRef.current || !originalImage) return;

      setProcessing(true);
      setError(null);

      try {
        // Ensure image is properly loaded
        const loadedImage = await ensureImageLoaded(imageRef.current);

        // Get image info for debugging
        setImageInfo({
          width: loadedImage.width,
          height: loadedImage.height,
          naturalWidth: loadedImage.naturalWidth,
          naturalHeight: loadedImage.naturalHeight,
        });

        console.log("Processing image:", {
          src: loadedImage.src.substring(0, 50) + "...",
          dimensions: `${loadedImage.naturalWidth}x${loadedImage.naturalHeight}`,
          complete: loadedImage.complete,
          mode: colorMode,
        });

        let processedImage: string;

        if (colorMode === "grayscale") {
          // Convert to grayscale
          processedImage = await convertToGrayscale(loadedImage);
          setGrayscaleImage(processedImage);
          console.log("Grayscale conversion successful");
        } else {
          // Keep RGB, just resize
          processedImage = await resizeImage(loadedImage, 224);
          setGrayscaleImage(null); // Clear grayscale when using RGB
          console.log("RGB resize successful");
        }

        // Resize to model input size for preview
        const resized = await resizeImage(loadedImage, 224);
        setResizedImage(resized);

        // Notify parent component
        if (onImageProcessed) {
          onImageProcessed(processedImage);
        }
      } catch (error) {
        console.error("Error processing image:", error);
        setError(
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      } finally {
        setProcessing(false);
      }
    };

    processImage();
  }, [originalImage, imageRef, colorMode, onImageProcessed]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Preview
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={showGrayscale ? "default" : "secondary"}>
              {showGrayscale ? "Grayscale" : "Original"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrayscale(!showGrayscale)}
              disabled={!grayscaleImage || processing}
            >
              {showGrayscale ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Original
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  Grayscale
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Image processing failed: {error}
              <br />
              <span className="text-xs">
                Try uploading a different image or refresh the page.
              </span>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Preview */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {processing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Processing image...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-red-500">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Processing failed</p>
                  </div>
                </div>
              ) : (
                <Image
                  src={
                    showGrayscale && grayscaleImage
                      ? grayscaleImage
                      : originalImage
                  }
                  alt={showGrayscale ? "Grayscale preview" : "Original image"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {showGrayscale && colorMode === "grayscale"
                  ? "Processed for Analysis"
                  : colorMode === "rgb"
                  ? "RGB Mode"
                  : "Original Upload"}
              </p>
              <p className="text-xs text-gray-500">
                {showGrayscale && colorMode === "grayscale"
                  ? "This is how the AI model will analyze your image"
                  : colorMode === "rgb"
                  ? "Analyzing with original colors"
                  : "Your uploaded blood smear image"}
              </p>
              {imageInfo && (
                <p className="text-xs text-gray-400 mt-1">
                  Dimensions: {imageInfo.naturalWidth}x{imageInfo.naturalHeight}{" "}
                  | Mode: {colorMode.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              Processing Steps ({colorMode.toUpperCase()} Mode)
            </h3>

            {/* Original thumbnail */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={originalImage || "/placeholder.svg"}
                  alt="Original"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <p className="text-sm font-medium">1. Original Image</p>
                <p className="text-xs text-gray-500">
                  RGB color image as uploaded
                </p>
                {imageInfo && (
                  <p className="text-xs text-gray-400">
                    {imageInfo.naturalWidth}x{imageInfo.naturalHeight}
                  </p>
                )}
              </div>
            </div>

            {/* Processing step */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {(colorMode === "grayscale" ? grayscaleImage : resizedImage) ? (
                  <Image
                    src={
                      (colorMode === "grayscale"
                        ? grayscaleImage
                        : resizedImage) || "/placeholder.svg"
                    }
                    alt="Processed"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  2.{" "}
                  {colorMode === "grayscale"
                    ? "Grayscale Conversion"
                    : "Color Preservation"}
                </p>
                <p className="text-xs text-gray-500">
                  {colorMode === "grayscale"
                    ? "Enhanced for malaria parasite detection"
                    : "Maintaining original RGB colors"}
                </p>
                {error && <p className="text-xs text-red-500">Failed</p>}
              </div>
            </div>

            {/* Resized thumbnail */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {resizedImage ? (
                  <Image
                    src={resizedImage || "/placeholder.svg"}
                    alt="Resized"
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">3. Resize to 224x224</p>
                <p className="text-xs text-gray-500">
                  Standardized input for AI model
                </p>
                {error && <p className="text-xs text-red-500">Failed</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Processing info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            {colorMode === "grayscale" ? "Why Grayscale?" : "Why RGB?"}
          </h4>
          <p className="text-sm text-blue-700">
            {colorMode === "grayscale"
              ? "Malaria parasites are more easily detected in grayscale images because it enhances the contrast between infected and healthy red blood cells. The AI model has been trained specifically on grayscale blood smear images for optimal accuracy."
              : "RGB mode preserves the original color information which may be useful for certain types of analysis. However, grayscale mode typically provides better accuracy for malaria parasite detection."}
          </p>
        </div>

        {/* Debug info */}
        {imageInfo && (
          <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
            <h4 className="text-xs font-medium text-gray-700 mb-2">
              Debug Info
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                Display Size: {imageInfo.width}x{imageInfo.height}
              </div>
              <div>
                Natural Size: {imageInfo.naturalWidth}x{imageInfo.naturalHeight}
              </div>
              <div>Processing: {processing ? "In Progress" : "Complete"}</div>
              <div>
                Status:{" "}
                {error ? "Error" : grayscaleImage ? "Success" : "Pending"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
