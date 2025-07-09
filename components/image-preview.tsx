"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ImageIcon, Palette, AlertTriangle, Clock } from "lucide-react";
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

// Helper function to safely create an image element
const createSafeImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; // Enable CORS
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error("Error loading image:", src, error);
      reject(new Error(`Failed to load image with src "${src}"`));
    };
  });
};

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
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    naturalWidth: number;
    naturalHeight: number;
    isLarge: boolean;
  } | null>(null);

  useEffect(() => {
    const processImage = async () => {
      if (!imageRef.current || !originalImage) return;

      setProcessing(true);
      setError(null);
      setProcessingStep("Loading image...");

      console.log("Starting image processing:", {
        src: originalImage.substring(0, 50) + "...",
        mode: colorMode,
        isPlaceholder: originalImage.includes("/placeholder.svg"),
      });

      let loadedImage: HTMLImageElement;

      try {
        setProcessingStep("Ensuring image is loaded...");

        // Try to use the existing image element first
        loadedImage = await ensureImageLoaded(imageRef.current);
      } catch (loadError) {
        console.warn(
          "Failed to load from imageRef, creating new image element:",
          loadError
        );

        // Fallback: create a new image element
        try {
          setProcessingStep("Creating safe image element...");
          loadedImage = await createSafeImageElement(originalImage);
        } catch (createError) {
          console.error("Failed to create safe image element:", createError);

          // Final fallback: create a canvas-based image for placeholder
          if (originalImage.includes("/placeholder.svg")) {
            setProcessingStep("Creating fallback image...");
            const canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              // Create a simple placeholder
              ctx.fillStyle = "#f3f4f6";
              ctx.fillRect(0, 0, 400, 400);
              ctx.fillStyle = "#6b7280";
              ctx.font = "20px Arial";
              ctx.textAlign = "center";
              ctx.fillText("Sample Blood Smear", 200, 180);
              ctx.fillText(`(${colorMode.toUpperCase()} Mode)`, 200, 220);

              // Add some visual elements to simulate blood cells
              ctx.fillStyle = "#ef4444";
              for (let i = 0; i < 20; i++) {
                const x = Math.random() * 360 + 20;
                const y = Math.random() * 360 + 20;
                const radius = Math.random() * 8 + 4;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
              }
            }

            loadedImage = new window.Image();
            loadedImage.src = canvas.toDataURL();
            await new Promise((resolve) => {
              loadedImage.onload = resolve;
            });
          } else {
            throw createError;
          }
        }
      }

      // Get image info for debugging
      const naturalWidth = loadedImage.naturalWidth || 400;
      const naturalHeight = loadedImage.naturalHeight || 400;
      const isLarge = naturalWidth > 2048 || naturalHeight > 2048;

      setImageInfo({
        width: loadedImage.width || 400,
        height: loadedImage.height || 400,
        naturalWidth,
        naturalHeight,
        isLarge,
      });

      console.log("Image loaded successfully:", {
        dimensions: `${naturalWidth}x${naturalHeight}`,
        complete: loadedImage.complete,
        mode: colorMode,
        isLarge,
      });

      let processedImage: string;

      try {
        if (colorMode === "grayscale") {
          setProcessingStep(
            isLarge
              ? "Converting large image to grayscale..."
              : "Converting to grayscale..."
          );
          // Convert to grayscale
          processedImage = await convertToGrayscale(loadedImage);
          setGrayscaleImage(processedImage);
          console.log("Grayscale conversion successful");
        } else {
          setProcessingStep(
            isLarge ? "Resizing large RGB image..." : "Processing RGB image..."
          );
          // Keep RGB, just resize
          processedImage = await resizeImage(loadedImage, 224);
          setGrayscaleImage(null); // Clear grayscale when using RGB
          console.log("RGB resize successful");
        }

        setProcessingStep("Creating preview...");
        // Resize to model input size for preview
        const resized = await resizeImage(loadedImage, 224);
        setResizedImage(resized);

        // Notify parent component
        if (onImageProcessed) {
          onImageProcessed(processedImage);
        }

        setProcessingStep("Complete!");
      } catch (processingError) {
        console.error("Image processing failed:", processingError);

        setProcessingStep("Processing failed, creating fallback...");

        // Create fallback processed images
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = colorMode === "grayscale" ? "#888888" : "#f3f4f6";
          ctx.fillRect(0, 0, 224, 224);
          ctx.fillStyle = colorMode === "grayscale" ? "#ffffff" : "#6b7280";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText("Processing Failed", 112, 100);
          ctx.fillText("Using Fallback", 112, 120);
        }

        const fallbackImage = canvas.toDataURL();

        if (colorMode === "grayscale") {
          setGrayscaleImage(fallbackImage);
        }
        setResizedImage(fallbackImage);

        if (onImageProcessed) {
          onImageProcessed(fallbackImage);
        }

        setError(
          `Processing failed: ${
            processingError instanceof Error
              ? processingError.message
              : String(processingError)
          }`
        );
      } finally {
        setProcessing(false);
        setProcessingStep("");
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(processImage, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [originalImage, imageRef, colorMode, onImageProcessed]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Preview
            {imageInfo?.isLarge && (
              <Badge variant="outline" className="text-xs">
                Large Image
              </Badge>
            )}
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
              {error}
              <br />
              <span className="text-xs">
                The system will continue with fallback processing.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Large Image Warning */}
        {imageInfo?.isLarge && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Large Image Detected:</strong> {imageInfo.naturalWidth}x
              {imageInfo.naturalHeight} pixels. Processing may take longer than
              usual. The image will be optimized for better performance.
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
                    <p className="text-sm text-gray-500">
                      {processingStep || "Processing image..."}
                    </p>
                    {imageInfo?.isLarge && (
                      <p className="text-xs text-gray-400 mt-1">
                        Large image detected - this may take a moment
                      </p>
                    )}
                  </div>
                </div>
              ) : error && !grayscaleImage && !resizedImage ? (
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
                  {imageInfo.isLarge && " | Optimized for processing"}
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
                  {imageInfo?.isLarge
                    ? "Large image - will be optimized"
                    : "RGB color image as uploaded"}
                </p>
                {imageInfo && (
                  <p className="text-xs text-gray-400">
                    {imageInfo.naturalWidth}x{imageInfo.naturalHeight}
                    {imageInfo.isLarge && " (Large)"}
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
                    ? imageInfo?.isLarge
                      ? "Enhanced detection with optimization"
                      : "Enhanced for malaria parasite detection"
                    : "Maintaining original RGB colors"}
                </p>
                {processing && processingStep && (
                  <p className="text-xs text-blue-600">{processingStep}</p>
                )}
                {error && (
                  <p className="text-xs text-red-500">
                    Failed (using fallback)
                  </p>
                )}
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
                {error && (
                  <p className="text-xs text-red-500">
                    Failed (using fallback)
                  </p>
                )}
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
          {imageInfo?.isLarge && (
            <p className="text-sm text-blue-700 mt-2">
              <strong>Large Image Optimization:</strong> Your image is being
              automatically resized and optimized for faster processing while
              maintaining quality for accurate analysis.
            </p>
          )}
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
                {error
                  ? "Error (Fallback)"
                  : grayscaleImage || resizedImage
                  ? "Success"
                  : "Pending"}
              </div>
              <div>
                Image Type: {imageInfo.isLarge ? "Large (Optimized)" : "Normal"}
              </div>
              <div>Mode: {colorMode.toUpperCase()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
